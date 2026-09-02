'use server';

import { adminDb } from '@/lib/firebase/admin';
import { getAdminSession } from '@/app/actions/adminAuth';
import { revalidatePath } from 'next/cache';

export async function addLocation(formData: FormData) {
  try {
    const session = await getAdminSession();
    if (!session) return { error: 'Unauthorized' };

    const name = formData.get('name') as string;
    const address = formData.get('address') as string;

    if (!name || !address) {
      return { error: 'Пожалуйста, заполните все поля' };
    }

    await adminDb.collection('locations').add({
      name,
      address,
      created_at: new Date(),
      is_active: true
    });

    revalidatePath('/admin/locations');
    return { success: true };
  } catch (error) {
    console.error('Error adding location:', error);
    return { error: 'Ошибка при добавлении точки' };
  }
}

export async function toggleLocationActive(locationId: string, currentStatus: boolean) {
  try {
    const session = await getAdminSession();
    if (!session) return { error: 'Unauthorized' };

    await adminDb.collection('locations').doc(locationId).update({
      is_active: !currentStatus
    });

    revalidatePath('/admin/locations');
    return { success: true };
  } catch (error) {
    console.error('Error toggling location:', error);
    return { error: 'Ошибка при изменении статуса' };
  }
}

export async function deleteLocation(locationId: string) {
  try {
    const session = await getAdminSession();
    if (!session) return { error: 'Unauthorized' };

    await adminDb.collection('locations').doc(locationId).delete();

    revalidatePath('/admin/locations');
    return { success: true };
  } catch (error) {
    console.error('Error deleting location:', error);
    return { error: 'Ошибка при удалении' };
  }
}

export async function updateLocation(locationId: string, formData: FormData) {
  try {
    const session = await getAdminSession();
    if (!session) return { error: 'Unauthorized' };

    const name = formData.get('name') as string;
    const address = formData.get('address') as string;
    const hookah_keyword = (formData.get('hookah_keyword') as string) || 'кальян';
    const replacement_keyword = (formData.get('replacement_keyword') as string) || 'замена';

    const override_salaries = formData.get('override_salaries') === 'on';
    const salary_base = override_salaries ? Number(formData.get('salary_base')) || 0 : null;
    const salary_base_conditional = override_salaries ? formData.get('salary_base_conditional') === 'on' : null;
    const salary_hookah = override_salaries ? Number(formData.get('salary_hookah')) || 0 : null;
    const salary_replacement = override_salaries ? Number(formData.get('salary_replacement')) || 0 : null;

    if (!name || !address) {
      return { error: 'Пожалуйста, заполните основные поля' };
    }

    await adminDb.collection('locations').doc(locationId).update({
      name,
      address,
      hookah_keyword,
      replacement_keyword,
      override_salaries,
      salary_base,
      salary_base_conditional,
      salary_hookah,
      salary_replacement,
      updated_at: new Date()
    });

    revalidatePath('/admin/locations');
    return { success: true };
  } catch (error) {
    console.error('Error updating location:', error);
    return { error: 'Ошибка при сохранении настроек' };
  }
}
