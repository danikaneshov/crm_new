import { adminDb } from '@/lib/firebase/admin';
import { getAdminSession } from '@/app/actions/adminAuth';
import { redirect } from 'next/navigation';
import { ClipboardCheck, AlertCircle, Calendar } from 'lucide-react';

export default async function AuditsPage() {
  const session = await getAdminSession();
  if (!session) redirect('/admin/login');

  const snapshot = await adminDb.collection('audits_start')
    .orderBy('date', 'desc')
    .limit(20)
    .get();

  const audits = await Promise.all(snapshot.docs.map(async doc => {
    const startData = doc.data();
    
    // Пытаемся найти закрытие для этой ревизии (в том же месяце)
    // Упрощенно: ищем audits_end с тем же location_id и month_id
    const endSnap = await adminDb.collection('audits_end')
      .where('location_id', '==', startData.location_id)
      .where('month_id', '==', startData.month_id)
      .limit(1)
      .get();
      
    const endData = endSnap.empty ? null : endSnap.docs[0].data();
    
    return {
      id: doc.id,
      location_id: startData.location_id,
      month_id: startData.month_id,
      start_date: startData.date.toDate(),
      end_date: endData ? endData.date.toDate() : null,
      status: endData ? 'CLOSED' : 'ACTIVE',
      start_tobacco: startData.tobacco_grams,
      start_coal: startData.coal_pieces,
      end_tobacco: endData ? endData.actual_tobacco : null,
      end_coal: endData ? endData.actual_coal : null,
      expected_tobacco: endData ? endData.expected_tobacco : null,
      expected_coal: endData ? endData.expected_coal : null,
      diff_tobacco: endData ? endData.diff_tobacco : null,
      diff_coal: endData ? endData.diff_coal : null,
    };
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white tracking-tight">Ревизии</h1>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {audits.length === 0 ? (
          <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/80 rounded-3xl p-10 text-center">
            <ClipboardCheck size={48} className="text-zinc-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Ревизий пока нет</h3>
            <p className="text-zinc-400">Старшие мастера еще не проводили инвентаризацию.</p>
          </div>
        ) : (
          audits.map(audit => (
            <div key={audit.id} className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/80 rounded-3xl p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-indigo-500"></span>
                    {audit.location_id}
                  </h3>
                  <p className="text-sm text-zinc-500 mt-1 flex items-center gap-1">
                    <Calendar size={14} /> Месяц: {audit.month_id}
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${audit.status === 'CLOSED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                  {audit.status === 'CLOSED' ? 'Завершена' : 'Активна'}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-zinc-950/50 rounded-2xl p-4 border border-zinc-800/50">
                  <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">Старт ревизии</h4>
                  <p className="text-xs text-zinc-500 mb-2">{audit.start_date.toLocaleDateString('ru-RU')}</p>
                  <div className="flex justify-between mt-2">
                    <span className="text-zinc-300">Табак:</span>
                    <span className="text-white font-bold">{audit.start_tobacco} гр</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-zinc-300">Уголь:</span>
                    <span className="text-white font-bold">{audit.start_coal} шт</span>
                  </div>
                </div>

                {audit.status === 'CLOSED' ? (
                  <div className="bg-zinc-950/50 rounded-2xl p-4 border border-zinc-800/50">
                    <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">Финиш ревизии</h4>
                    <p className="text-xs text-zinc-500 mb-2">{audit.end_date?.toLocaleDateString('ru-RU')}</p>
                    
                    <div className="flex justify-between mt-2 text-sm">
                      <span className="text-zinc-400">Табак (Ожидание / Факт):</span>
                      <span className="text-white font-medium">{audit.expected_tobacco} / {audit.end_tobacco}</span>
                    </div>
                    <div className={`text-right text-xs font-bold ${Number(audit.diff_tobacco) < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                      Разница: {audit.diff_tobacco} гр
                    </div>

                    <div className="flex justify-between mt-3 text-sm">
                      <span className="text-zinc-400">Уголь (Ожидание / Факт):</span>
                      <span className="text-white font-medium">{audit.expected_coal} / {audit.end_coal}</span>
                    </div>
                    <div className={`text-right text-xs font-bold ${Number(audit.diff_coal) < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                      Разница: {audit.diff_coal} шт
                    </div>
                  </div>
                ) : (
                  <div className="bg-zinc-950/50 rounded-2xl p-4 border border-zinc-800/50 flex flex-col items-center justify-center text-center h-full">
                    <AlertCircle size={24} className="text-amber-500/50 mb-2" />
                    <p className="text-sm font-medium text-amber-500/80">Ожидает закрытия месяца</p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
