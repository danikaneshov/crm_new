import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { authenticateMiniApp } from '@/lib/telegram/middleware';

export async function POST(req: Request) {
  try {
    const auth = await authenticateMiniApp(req);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: 401 });

    const { location_id, second_master_id } = await req.json();
    if (!location_id) return NextResponse.json({ error: 'Location required' }, { status: 400 });

    const shiftsRef = adminDb.collection('shifts');
    
    // Check if master already has an open shift
    const existingOpen = await shiftsRef
      .where('first_master_id', '==', auth.employeeId)
      .where('status', 'in', ['OPEN', 'PROCESSING'])
      .get();
      
    if (!existingOpen.empty) {
      return NextResponse.json({ error: 'Already have an open shift' }, { status: 400 });
    }

    const newShift = {
      location_id,
      first_master_id: auth.employeeId,
      second_master_id: second_master_id || null,
      first_master_shift_coefficient: 1.0,
      second_master_shift_coefficient: second_master_id ? 0.5 : null,
      status: 'OPEN',
      opened_at: new Date(),
      closed_at: null,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const docRef = await shiftsRef.add(newShift);

    return NextResponse.json({ ok: true, shiftId: docRef.id });
  } catch (error) {
    console.error('Open shift error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
