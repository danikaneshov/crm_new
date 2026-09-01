'use server';

import { adminDb } from '@/lib/firebase/admin';
import { getSession } from './auth';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function getActiveLocations() {
  try {
    const session = await getSession();
    if (!session) return { error: 'Unauthorized' };

    const snapshot = await adminDb.collection('locations')
      .where('is_active', '==', true)
      .get();
      
    return {
      locations: snapshot.docs
        .filter(doc => session.location_ids?.includes(doc.data().name))
        .map(doc => ({
          id: doc.id,
          name: doc.data().name
        }))
    };
  } catch (error) {
    console.error('Error fetching locations:', error);
    return [];
  }
}

export async function setLocationCookie(id: string, name: string) {
  const cookieStore = await cookies();
  cookieStore.set('location_id', id, { path: '/' });
  cookieStore.set('location_name', name, { path: '/' });
  redirect('/mini-app');
}
