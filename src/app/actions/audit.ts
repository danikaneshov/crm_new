'use server';

import { adminDb } from '@/lib/firebase/admin';
import { getSession } from './auth';
import { FieldValue } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';

const TOBACCO_PRICE = 37; // 37 тенге за грамм
const COAL_PRICE = 50; // 50 тенге за штуку

// Константы расхода на 1 кальян/замену (можно вынести в БД позже)
const TOBACCO_PER_SALE = 20; // 20 грамм на кальян
const COAL_PER_SALE = 4; // 4 угля на кальян

// 1. Создание стартовой ревизии
export async function createInitialAudit(locationId: string, tobaccoGrams: number, coalPieces: number) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'senior_master') return { error: 'Unauthorized' };

    // Проверяем, нет ли уже стартовой ревизии
    const existingSnap = await adminDb.collection('audits_start')
      .where('location_id', '==', locationId)
      .limit(1)
      .get();

    if (!existingSnap.empty) {
      return { error: 'Стартовая ревизия для этой точки уже существует!' };
    }

    await adminDb.collection('audits_start').add({
      location_id: locationId,
      tobacco_grams: tobaccoGrams,
      coal_pieces: coalPieces,
      tobacco_price: TOBACCO_PRICE,
      coal_price: COAL_PRICE,
      created_by: session.id,
      created_at: FieldValue.serverTimestamp()
    });

    revalidatePath('/mini-app/audit');
    return { success: true };
  } catch (error) {
    console.error('Error creating initial audit:', error);
    return { error: 'Ошибка при сохранении ревизии' };
  }
}

// Получить текущее состояние (ожидаемые остатки и стартовую ревизию)
export async function getAuditStatus(locationId: string) {
  try {
    const session = await getSession();
    if (!session) return { error: 'Unauthorized' };

    // Ищем стартовую ревизию
    const startSnap = await adminDb.collection('audits_start')
      .where('location_id', '==', locationId)
      .limit(1)
      .get();

    if (startSnap.empty) {
      return { status: 'NO_INITIAL_AUDIT' };
    }

    const startData = startSnap.docs[0].data();

    // Ищем последнюю закрытую ревизию (чтобы считать смены только ПОСЛЕ нее)
    const lastAuditSnap = await adminDb.collection('audits_closed')
      .where('location_id', '==', locationId)
      .orderBy('created_at', 'desc')
      .limit(1)
      .get();

    let startDate = startData.created_at;
    if (!lastAuditSnap.empty) {
      startDate = lastAuditSnap.docs[0].data().created_at;
      // В качестве входных остатков берем фактические остатки из прошлой ревизии
      startData.tobacco_grams = lastAuditSnap.docs[0].data().actual.tobacco;
      startData.coal_pieces = lastAuditSnap.docs[0].data().actual.coal;
    }

    // Получаем все закрытые/исправленные смены с даты startDate
    const shiftsSnap = await adminDb.collection('shifts')
      .where('location_id', '==', locationId)
      .where('status', 'in', ['CLOSED', 'CORRECTED'])
      .where('created_at', '>=', startDate)
      .get();

    let totalSales = 0;
    const mastersData: Record<string, { shifts: number; coefficient: number }> = {};

    shiftsSnap.docs.forEach(doc => {
      const shift = doc.data();
      const sales = (shift.hookahs || 0) + (shift.replacements || 0);
      totalSales += sales;

      const isDuo = shift.type === 'duo';
      const m1 = shift.first_master_id;
      const m2 = shift.second_master_id;

      if (isDuo) {
        if (m1) {
          if (!mastersData[m1]) mastersData[m1] = { shifts: 0, coefficient: 0 };
          mastersData[m1].shifts += 1;
          mastersData[m1].coefficient += 0.5;
        }
        if (m2) {
          if (!mastersData[m2]) mastersData[m2] = { shifts: 0, coefficient: 0 };
          mastersData[m2].shifts += 1;
          mastersData[m2].coefficient += 0.5;
        }
      } else {
        if (m1) {
          if (!mastersData[m1]) mastersData[m1] = { shifts: 0, coefficient: 0 };
          mastersData[m1].shifts += 1;
          mastersData[m1].coefficient += 1;
        }
      }
    });

    // Расчет ожидаемого остатка
    const expectedTobacco = startData.tobacco_grams - (totalSales * TOBACCO_PER_SALE);
    const expectedCoal = startData.coal_pieces - (totalSales * COAL_PER_SALE);

    return {
      status: 'ACTIVE_MONTH',
      startData,
      totalSales,
      expectedTobacco,
      expectedCoal,
      mastersData
    };

  } catch (error) {
    console.error('Error getting audit status:', error);
    return { error: 'Ошибка получения данных' };
  }
}

// 3. Закрытие ревизии
export async function closeAudit(locationId: string, actualTobacco: number, actualCoal: number) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'senior_master') return { error: 'Unauthorized' };

    const statusObj = await getAuditStatus(locationId);
    if (statusObj.error || statusObj.status !== 'ACTIVE_MONTH') {
      return { error: 'Невозможно закрыть ревизию (нет данных)' };
    }

    const { startData, expectedTobacco, expectedCoal, mastersData } = statusObj;

    // Считаем разницу
    const tobaccoDiff = expectedTobacco! - actualTobacco;
    const coalDiff = expectedCoal! - actualCoal;

    const tobaccoShortage = tobaccoDiff > 0 ? tobaccoDiff : 0;
    const coalShortage = coalDiff > 0 ? coalDiff : 0;
    const tobaccoExcess = tobaccoDiff < 0 ? Math.abs(tobaccoDiff) : 0;
    const coalExcess = coalDiff < 0 ? Math.abs(coalDiff) : 0;

    const tobaccoCost = tobaccoShortage * TOBACCO_PRICE;
    const coalCost = coalShortage * COAL_PRICE;
    const totalCost = tobaccoCost + coalCost;

    // Распределяем недостачу
    let totalCoefficient = 0;
    Object.values(mastersData!).forEach(m => { totalCoefficient += m.coefficient });

    const mastersResult: Record<string, any> = {};
    const costPerCoefficient = totalCoefficient > 0 ? (totalCost / totalCoefficient) : 0;

    for (const [masterId, data] of Object.entries(mastersData!)) {
      // Ищем имя мастера для истории
      const empDoc = await adminDb.collection('employees').doc(masterId).get();
      const empName = empDoc.exists ? empDoc.data()?.name : masterId;

      mastersResult[empName] = {
        master_id: masterId,
        shifts_count: data.shifts,
        coefficient: data.coefficient,
        shortage_cost: Number((data.coefficient * costPerCoefficient).toFixed(2))
      };
    }

    const currentPeriod = new Date().toISOString().substring(0, 7); // "YYYY-MM"

    // Сохраняем snapshot
    await adminDb.collection('audits_closed').add({
      location_id: locationId,
      period: currentPeriod,
      opening: {
        tobacco: startData?.tobacco_grams,
        coal: startData?.coal_pieces
      },
      expected: {
        tobacco: expectedTobacco,
        coal: expectedCoal
      },
      actual: {
        tobacco: actualTobacco,
        coal: actualCoal
      },
      shortage: {
        tobacco_grams: tobaccoShortage,
        tobacco_cost: tobaccoCost,
        coal_pieces: coalShortage,
        coal_cost: coalCost,
        total: totalCost
      },
      excess: {
        tobacco_grams: tobaccoExcess,
        coal_pieces: coalExcess
      },
      masters: mastersResult,
      created_by: session.id,
      created_at: FieldValue.serverTimestamp()
    });

    revalidatePath('/mini-app/audit');
    return { success: true };
  } catch (error) {
    console.error('Error closing audit:', error);
    return { error: 'Ошибка закрытия ревизии' };
  }
}
