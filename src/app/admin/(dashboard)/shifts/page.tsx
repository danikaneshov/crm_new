import { adminDb } from '@/lib/firebase/admin';
import { ClipboardList, Trash2, CheckCircle2, Search, Filter } from 'lucide-react';
import { approveShift, deleteShift } from '@/app/actions/admin/shifts';

async function getShifts() {
  try {
    const snapshot = await adminDb.collection('shifts')
      .orderBy('created_at', 'desc')
      .limit(50)
      .get();
      
    const employeesSnap = await adminDb.collection('employees').get();
    const employeesMap = new Map();
    employeesSnap.docs.forEach(doc => {
      employeesMap.set(doc.id, doc.data().name);
    });

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        master_name: employeesMap.get(data.first_master_id) || data.first_master_id,
        created_at: data.created_at?.toDate()?.toLocaleString('ru-RU', {
          day: '2-digit', month: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit'
        })
      };
    }) as any[];
  } catch (error) {
    console.error(error);
    return [];
  }
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'OPEN':
      return <span className="bg-emerald-500/10 text-emerald-400 text-[10px] uppercase font-bold px-2 py-1 rounded-full border border-emerald-500/20">Открыта</span>;
    case 'CLOSED':
      return <span className="bg-blue-500/10 text-blue-400 text-[10px] uppercase font-bold px-2 py-1 rounded-full border border-blue-500/20">Закрыта</span>;
    case 'NEEDS_REVIEW':
      return <span className="bg-amber-500/10 text-amber-400 text-[10px] uppercase font-bold px-2 py-1 rounded-full border border-amber-500/20">На проверке</span>;
    case 'CORRECTED':
      return <span className="bg-indigo-500/10 text-indigo-400 text-[10px] uppercase font-bold px-2 py-1 rounded-full border border-indigo-500/20">Исправлена</span>;
    default:
      return <span className="bg-zinc-800 text-zinc-400 text-[10px] uppercase font-bold px-2 py-1 rounded-full">{status}</span>;
  }
}

export default async function AdminShiftsPage() {
  const shifts = await getShifts();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight mb-2">История смен</h1>
          <p className="text-zinc-400">Просмотр и подтверждение отчетов</p>
        </div>
      </div>

      <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/80 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-[80px] pointer-events-none"></div>
        
        <div className="flex items-center gap-2 mb-6 relative z-10">
          <ClipboardList className="text-amber-400" />
          <h2 className="text-xl font-bold text-white">Все смены ({shifts.length})</h2>
        </div>
        
        <div className="overflow-x-auto relative z-10">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-zinc-800/80">
                <th className="pb-4 text-sm font-medium text-zinc-500 pl-4">Дата / Точка</th>
                <th className="pb-4 text-sm font-medium text-zinc-500">Мастер</th>
                <th className="pb-4 text-sm font-medium text-zinc-500">Статус</th>
                <th className="pb-4 text-sm font-medium text-zinc-500">Продажи / ЗП</th>
                <th className="pb-4 text-sm font-medium text-zinc-500 text-right pr-4">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {shifts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-zinc-500">
                    Смен пока нет
                  </td>
                </tr>
              ) : (
                shifts.map((shift) => (
                  <tr key={shift.id} className={`hover:bg-zinc-800/20 transition-colors group ${shift.status === 'NEEDS_REVIEW' ? 'bg-amber-500/5' : ''}`}>
                    <td className="py-4 pl-4 align-top pt-5">
                      <p className="text-white font-medium">{shift.location_id}</p>
                      <p className="text-xs text-zinc-500 mt-1">{shift.created_at}</p>
                      {shift.type === 'duo' && (
                        <span className="inline-block mt-2 bg-purple-500/10 text-purple-400 text-[10px] px-2 py-0.5 rounded border border-purple-500/20">Два мастера</span>
                      )}
                    </td>
                    <td className="py-4 align-top pt-5">
                      <p className="text-zinc-300 font-medium">{shift.master_name}</p>
                    </td>
                    <td className="py-4 align-top pt-5">
                      <StatusBadge status={shift.status} />
                    </td>
                    <td className="py-4 align-top pt-4">
                      {shift.status !== 'OPEN' ? (
                        <div className="text-sm">
                          <p className="text-zinc-300">Кальяны: <span className="text-white font-bold">{shift.hookahs || 0}</span></p>
                          <p className="text-zinc-300">Замены: <span className="text-white font-bold">{shift.replacements || 0}</span></p>
                          <p className="text-indigo-400 font-bold mt-1">{shift.first_master_salary || 0} ₸</p>
                        </div>
                      ) : (
                        <span className="text-zinc-600 text-sm italic">В процессе...</span>
                      )}
                    </td>
                    <td className="py-4 pr-4 align-top pt-4">
                      {shift.status === 'NEEDS_REVIEW' && (
                        <div className="flex flex-col gap-2 bg-zinc-950 p-3 rounded-xl border border-zinc-800/80 mb-3 shadow-inner">
                          <p className="text-xs text-amber-500 mb-1">Raw AI Response:</p>
                          <pre className="text-[10px] text-zinc-400 whitespace-pre-wrap font-mono overflow-hidden">
                            {shift.ai_raw_response?.substring(0, 50) || 'Нет данных'}...
                          </pre>
                          <form action={async (formData) => {
                            'use server';
                            await approveShift(
                              shift.id, 
                              Number(formData.get('hookahs')), 
                              Number(formData.get('replacements'))
                            );
                          }} className="mt-2 flex flex-col gap-2">
                            <div className="flex gap-2">
                              <input type="number" name="hookahs" placeholder="Кал" required className="w-16 bg-zinc-900 border border-zinc-700 rounded p-1 text-xs text-white" />
                              <input type="number" name="replacements" placeholder="Зам" required className="w-16 bg-zinc-900 border border-zinc-700 rounded p-1 text-xs text-white" />
                            </div>
                            <button type="submit" className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs py-1.5 px-3 rounded flex items-center justify-center gap-1 transition-colors">
                              <CheckCircle2 size={14} /> Подтвердить
                            </button>
                          </form>
                        </div>
                      )}
                      
                      <div className="flex justify-end">
                        <form action={async () => {
                          'use server';
                          await deleteShift(shift.id);
                        }}>
                          <button type="submit" className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all" title="Удалить смену">
                            <Trash2 size={20} />
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
