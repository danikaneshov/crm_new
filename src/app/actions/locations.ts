'use server';

import { adminDb } from '@/lib/firebase/admin';
import { getSession } from './auth';

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
