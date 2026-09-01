'use server';

import { adminDb } from '@/lib/firebase/admin';
import { revalidatePath } from 'next/cache';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getSession } from './auth';

// Инициализация Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function openShift(locationId: string, type: 'solo' | 'duo', secondMasterId?: string) {
  try {
    const session = await getSession();
    if (!session) return { error: 'Не авторизован' };

    const shiftRef = await adminDb.collection('shifts').add({
      location_id: locationId,
      first_master_id: session.id,
      second_master_id: type === 'duo' ? (secondMasterId || null) : null,
      status: 'OPEN',
      type: type,
      created_at: new Date(),
    });

    return { success: true, shiftId: shiftRef.id };
  } catch (error) {
    console.error('Error opening shift:', error);
    return { error: 'Ошибка при открытии смены' };
  }
}

export async function getCurrentShift(locationId: string) {
  try {
    const session = await getSession();
    if (!session) return { error: 'Не авторизован' };

    const snapshot = await adminDb.collection('shifts')
      .where('location_id', '==', locationId)
      .where('status', '==', 'OPEN')
      .where('first_master_id', '==', session.id)
      .limit(1)
      .get();

    if (snapshot.empty) return { shift: null };

    const doc = snapshot.docs[0];
    return { shift: { id: doc.id, ...doc.data() } };
  } catch (error) {
    console.error('Error fetching current shift:', error);
    return { error: 'Ошибка при получении смены' };
  }
}

export async function closeShiftWithImage(shiftId: string, formData: FormData) {
  try {
    const session = await getSession();
    if (!session) return { error: 'Не авторизован' };
    const employeeId = session.id;
    const file = formData.get('image') as File;
    if (!file) return { error: 'Изображение не найдено' };

    // Меняем статус на PROCESSING
    await adminDb.collection('shifts').doc(shiftId).update({
      status: 'PROCESSING'
    });

    // 1. Получаем данные для подписи (смена и сотрудник)
    const [shiftDoc, empDoc] = await Promise.all([
      adminDb.collection('shifts').doc(shiftId).get(),
      adminDb.collection('employees').doc(employeeId).get()
    ]);
    
    if (!empDoc.exists) return { error: 'Сотрудник не найден' };
    const empData = empDoc.data();
    const shiftData = shiftDoc.data();
    const isDuo = shiftData?.type === 'duo';

    // 2. Преобразуем файл в base64 для Gemini
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // 3. Подготавливаем промисы для параллельного выполнения (Gemini + Telegram)
    
    // Промис 1: Gemini AI
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Посмотри на это фото отчета закрытия смены (чека r_keeper). 
    Найди количество проданных кальянов и количество замен чаш.
    Если не можешь найти точно, верни 0.
    Верни строго только валидный JSON в формате: {"hookahs": число, "replacements": число}. Без маркдауна и других слов.`;

    const imageParts = [{
      inlineData: {
        data: buffer.toString("base64"),
        mimeType: file.type
      }
    }];

    const geminiPromise = model.generateContent([prompt, ...imageParts]).then(async (result) => {
      const response = await result.response;
      return response.text().trim();
    });

    // Промис 2: Отправка в Telegram
    const tgPromise = (async () => {
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      const chatId = process.env.TELEGRAM_STORAGE_CHAT_ID;
      if (!botToken || !chatId) return null;

      const tgFormData = new FormData();
      tgFormData.append('chat_id', chatId);
      tgFormData.append('photo', file);
      tgFormData.append('caption', `🧾 Закрытие смены\n📍 Точка: ${shiftData?.location_id}\n👤 Мастер: ${empData?.name || employeeId}`);

      try {
        const res = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
          method: 'POST',
          body: tgFormData,
        });
        const data = await res.json();
        if (data.ok) {
          return {
            message_id: data.result.message_id,
            file_id: data.result.photo[data.result.photo.length - 1].file_id,
          };
        }
      } catch (e) {
        console.error('Telegram upload error:', e);
      }
      return null;
    })();

    // Ждем выполнения обоих
    const [textResponse, tgResult] = await Promise.all([geminiPromise, tgPromise]);
    
    let text = textResponse;
    // Очистка от маркдауна (если вдруг Gemini его добавил)
    if (text.startsWith('```json')) text = text.replace(/```json/g, '');
    if (text.startsWith('```')) text = text.replace(/```/g, '');
    text = text.trim();

    let parsedResult;
    try {
      parsedResult = JSON.parse(text);
    } catch (e) {
      console.error('Failed to parse Gemini response:', text);
      // Если распарсить не удалось, помечаем как требующее ревью
      await adminDb.collection('shifts').doc(shiftId).update({
        status: 'NEEDS_REVIEW',
        ai_raw_response: text,
        telegram_message_id: tgResult?.message_id || null,
        telegram_file_id: tgResult?.file_id || null
      });
      return { success: true, status: 'NEEDS_REVIEW' };
    }

    const hookahs = Number(parsedResult.hookahs) || 0;
    const replacements = Number(parsedResult.replacements) || 0;
    const totalSales = hookahs + replacements;

    // Расчет ЗП
    const salaryBase = Number(empData?.salary_base || 0);
    const salaryPerSale = Number(empData?.salary_per_sale || 0);

    let finalSalary = 0;
    let secondMasterSalary = 0;

    if (isDuo && shiftData?.second_master_id) {
      // Получаем ставку второго мастера
      const secondEmpDoc = await adminDb.collection('employees').doc(shiftData.second_master_id).get();
      const secondEmpData = secondEmpDoc.data();
      const secondSalaryBase = Number(secondEmpData?.salary_base || 0);
      const secondSalaryPerSale = Number(secondEmpData?.salary_per_sale || 0);

      const secondSales = Math.floor(totalSales / 2);
      const firstSales = totalSales - secondSales;
      
      finalSalary = salaryBase + (firstSales * salaryPerSale);
      secondMasterSalary = (secondSalaryBase / 2) + (secondSales * secondSalaryPerSale);
    } else {
      finalSalary = salaryBase + (totalSales * salaryPerSale);
    }

    // Сохраняем в базу
    await adminDb.collection('shifts').doc(shiftId).update({
      status: 'CLOSED',
      hookahs: hookahs,
      replacements: replacements,
      total_sales: totalSales,
      first_master_salary: finalSalary,
      second_master_salary: secondMasterSalary,
      ai_raw_response: text,
      telegram_message_id: tgResult?.message_id || null,
      telegram_file_id: tgResult?.file_id || null,
      closed_at: new Date()
    });

    return { 
      success: true, 
      status: 'CLOSED', 
      sales: totalSales, 
      salary: finalSalary 
    };

  } catch (error) {
    console.error('Error closing shift with AI:', error);
    // Возвращаем на OPEN, чтобы можно было повторить
    await adminDb.collection('shifts').doc(shiftId).update({
      status: 'OPEN'
    });
    return { error: `Ошибка обработки фотографии: ${error instanceof Error ? error.message : String(error)}` };
  }
}

export async function getEmployeeShifts() {
  try {
    const session = await getSession();
    if (!session) return [];

    const snapshot = await adminDb.collection('shifts')
      .where('first_master_id', '==', session.id)
      .where('status', '==', 'CLOSED')
      .orderBy('closed_at', 'desc')
      .limit(30)
      .get();
      
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        location_id: data.location_id,
        total_sales: data.total_sales || 0,
        salary: data.first_master_salary || 0,
        closed_at: data.closed_at ? data.closed_at.toMillis() : null
      };
    });
  } catch (error) {
    console.error('Error fetching history:', error);
    return [];
  }
}
