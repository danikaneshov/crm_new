'use server';

import { adminDb } from '@/lib/firebase/admin';
import { getAdminSession } from '@/app/actions/adminAuth';
import { revalidatePath } from 'next/cache';

export async function addEmployee(formData: FormData) {
  try {
    const session = await getAdminSession();
    if (!session) return { error: 'Unauthorized' };

    const name = formData.get('name') as string;
    const salaryBase = Number(formData.get('salaryBase'));
    const salaryPerSale = Number(formData.get('salaryPerSale'));
    const role = (formData.get('role') as string) || 'master';
    
    // Получаем массив локаций (checkboxes)
    const locationIds = formData.getAll('locations') as string[];

    if (!name) {
      return { error: 'Пожалуйста, заполните имя' };
    }

    // Генерируем 4-значный ПИН-код, если он не передан
    const pin = (formData.get('pin') as string) || Math.floor(1000 + Math.random() * 9000).toString();

    await adminDb.collection('employees').add({
      name,
      pin,
      salary_base: salaryBase || 0,
      salary_per_sale: salaryPerSale || 0,
      location_ids: locationIds,
      role: role,
      is_active: true,
      created_at: new Date()
    });

    revalidatePath('/admin/employees');
    return { success: true };
  } catch (error) {
    console.error('Error adding employee:', error);
    return { error: 'Ошибка при добавлении сотрудника' };
  }
}

export async function toggleEmployeeActive(employeeId: string, currentStatus: boolean) {
  try {
    const session = await getAdminSession();
    if (!session) return { error: 'Unauthorized' };

    await adminDb.collection('employees').doc(employeeId).update({
      is_active: !currentStatus
    });

    revalidatePath('/admin/employees');
    return { success: true };
  } catch (error) {
    console.error('Error toggling employee:', error);
    return { error: 'Ошибка при изменении статуса' };
  }
}

export async function deleteEmployee(employeeId: string) {
  try {
    const session = await getAdminSession();
    if (!session) return { error: 'Unauthorized' };

    await adminDb.collection('employees').doc(employeeId).delete();

    revalidatePath('/admin/employees');
    return { success: true };
  } catch (error) {
    console.error('Error deleting employee:', error);
    return { error: 'Ошибка при удалении' };
  }
}
