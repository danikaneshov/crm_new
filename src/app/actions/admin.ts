'use server';

import { adminDb } from '@/lib/firebase/admin';
import { revalidatePath } from 'next/cache';

export async function addLocation(formData: FormData) {
  const name = formData.get('name') as string;
  if (!name) return { error: 'Название обязательно' };

  try {
    await adminDb.collection('locations').add({
      name,
      is_active: true,
      created_at: new Date()
    });
    
    revalidatePath('/admin/locations');
    return { success: true };
  } catch (error) {
    return { error: 'Ошибка при сохранении' };
  }
}

export async function addEmployee(formData: FormData) {
  const name = formData.get('name') as string;
  const telegram_id = formData.get('telegram_id') as string;
  const salary_base = parseInt(formData.get('salary_base') as string) || 0;
  const salary_per_sale = parseInt(formData.get('salary_per_sale') as string) || 0;

  if (!name) return { error: 'Имя обязательно' };

  try {
    await adminDb.collection('employees').add({
      name,
      telegram_id: telegram_id || null,
      salary_base,
      salary_per_sale,
      is_active: true,
      created_at: new Date()
    });
    
    revalidatePath('/admin/employees');
    return { success: true };
  } catch (error) {
    return { error: 'Ошибка при сохранении' };
  }
}
