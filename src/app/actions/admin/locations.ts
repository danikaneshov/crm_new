'use server';

import { adminDb } from '@/lib/firebase/admin';
import { getAdminSession } from '@/app/actions/adminAuth';
import { FieldValue } from 'firebase-admin/firestore';
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
      created_at: FieldValue.serverTimestamp(),
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
