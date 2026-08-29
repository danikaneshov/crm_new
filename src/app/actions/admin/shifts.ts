'use server';

import { adminDb } from '@/lib/firebase/admin';
import { getAdminSession } from '@/app/actions/adminAuth';
import { revalidatePath } from 'next/cache';

export async function approveShift(shiftId: string, hookahs: number, replacements: number) {
  try {
    const session = await getAdminSession();
    if (!session) return { error: 'Unauthorized' };

    const shiftDoc = await adminDb.collection('shifts').doc(shiftId).get();
    if (!shiftDoc.exists) return { error: 'Смена не найдена' };

    const shiftData = shiftDoc.data()!;
    const totalSales = hookahs + replacements;
    
    // Получаем сотрудника для расчета ЗП
    const empDoc = await adminDb.collection('employees').doc(shiftData.first_master_id).get();
    const empData = empDoc.data();
    
    if (!empData) return { error: 'Сотрудник не найден' };

    const salaryBase = Number(empData.salary_base || 0);
    const salaryPerSale = Number(empData.salary_per_sale || 0);
    const isDuo = shiftData.type === 'duo';

    let finalSalary = 0;
    if (isDuo) {
      const secondSales = Math.floor(totalSales / 2);
      const firstSales = totalSales - secondSales;
      finalSalary = salaryBase + (firstSales * salaryPerSale);
    } else {
      finalSalary = salaryBase + (totalSales * salaryPerSale);
    }

    await adminDb.collection('shifts').doc(shiftId).update({
      status: 'CORRECTED',
      hookahs,
      replacements,
      total_sales: totalSales,
      first_master_salary: finalSalary,
      corrected_at: new Date()
    });

    revalidatePath('/admin/shifts');
    return { success: true };
  } catch (error) {
    console.error('Error approving shift:', error);
    return { error: 'Ошибка при подтверждении' };
  }
}

export async function deleteShift(shiftId: string) {
  try {
    const session = await getAdminSession();
    if (!session) return { error: 'Unauthorized' };

    await adminDb.collection('shifts').doc(shiftId).delete();

    revalidatePath('/admin/shifts');
    return { success: true };
  } catch (error) {
    console.error('Error deleting shift:', error);
    return { error: 'Ошибка при удалении' };
  }
}
