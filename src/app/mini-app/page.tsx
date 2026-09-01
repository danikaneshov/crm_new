import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getSession } from '@/app/actions/auth';
import { getCurrentShift } from '@/app/actions/shifts';
import { adminDb } from '@/lib/firebase/admin';
import ShiftClient from '@/components/mini-app/ShiftClient';

export default async function ShiftScreen() {
  const session = await getSession();
  
  if (!session) {
    redirect('/mini-app/login');
  }

  const cookieStore = await cookies();
  const locationId = cookieStore.get('location_id')?.value;
  const locationName = cookieStore.get('location_name')?.value;

  if (!locationId) {
    redirect('/mini-app/select-location');
  }

  // Получаем текущую смену с сервера (мгновенно)
  const shiftResult = await getCurrentShift(locationId);
  let initialShiftStatus: 'CLOSED' | 'OPEN' | 'PROCESSING' = 'CLOSED';
  let initialShiftId = null;

  if (shiftResult?.shift) {
    initialShiftStatus = 'OPEN';
    initialShiftId = shiftResult.shift.id;
  }

  // Получаем других сотрудников этой точки для напарника
  const employeesSnapshot = await adminDb.collection('employees')
    .where('is_active', '==', true)
    .where('location_ids', 'array-contains', locationName || locationId)
    .get();

  const availablePartners = employeesSnapshot.docs
    .map(doc => ({ id: doc.id, name: doc.data().name }))
    .filter(emp => emp.id !== session.id); // Исключаем себя

  return (
    <div className="p-6 pt-10 min-h-[100dvh] bg-zinc-950 flex flex-col">
      <ShiftClient 
        locationId={locationId}
        locationName={locationName || locationId}
        employeeName={session.name}
        initialShiftStatus={initialShiftStatus}
        initialShiftId={initialShiftId}
        availablePartners={availablePartners}
      />
    </div>
  );
}
