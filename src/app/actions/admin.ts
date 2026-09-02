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


