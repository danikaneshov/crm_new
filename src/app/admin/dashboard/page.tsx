import { Users, FileText, CheckCircle2, BarChart3 } from 'lucide-react';
import { adminDb } from '@/lib/firebase/admin';

export default async function Dashboard() {
  // Fetch real data from Firestore
  const shiftsSnapshot = await adminDb.collection('shifts').get();
  
  let totalSales = 0;
  let totalShifts = shiftsSnapshot.size;
  let totalSalaryFund = 0;

  shiftsSnapshot.forEach(doc => {
    const data = doc.data();
    if (data.status === 'CLOSED' || data.status === 'NEEDS_REVIEW') {
      totalSales += data.total_sales || 0;
      totalSalaryFund += (data.first_master_salary || 0) + (data.second_master_salary || 0);
    }
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Дашборд</h1>
        <div className="flex flex-wrap gap-3 w-full sm:w-auto">
          <select className="flex-1 sm:flex-none bg-white border border-zinc-200 text-sm rounded-xl px-4 py-2.5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] outline-none hover:border-zinc-300 transition-colors">
            <option>Август 2026</option>
            <option>Все время</option>
          </select>
          <select className="flex-1 sm:flex-none bg-white border border-zinc-200 text-sm rounded-xl px-4 py-2.5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] outline-none hover:border-zinc-300 transition-colors">
            <option>Все точки</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-zinc-200/60 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex items-center justify-between hover:shadow-[0_4px_24px_rgba(0,0,0,0.06)] transition-shadow">
          <div>
            <p className="text-sm font-medium text-zinc-500 mb-2">Продажи (Итого)</p>
            <p className="text-4xl font-black text-zinc-900">{totalSales}</p>
          </div>
          <div className="w-14 h-14 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner">
            <FileText size={28} />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-zinc-200/60 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex items-center justify-between hover:shadow-[0_4px_24px_rgba(0,0,0,0.06)] transition-shadow">
          <div>
            <p className="text-sm font-medium text-zinc-500 mb-2">Закрыто смен</p>
            <p className="text-4xl font-black text-zinc-900">{totalShifts}</p>
          </div>
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-50 to-indigo-100/50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-inner">
            <CheckCircle2 size={28} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-zinc-200/60 shadow-[0_4px_24px_rgba(0,0,0,0.02)] flex items-center justify-between hover:shadow-[0_4px_24px_rgba(0,0,0,0.06)] transition-shadow">
          <div>
            <p className="text-sm font-medium text-zinc-500 mb-2">Фонд ЗП</p>
            <p className="text-4xl font-black text-zinc-900">{totalSalaryFund.toLocaleString()} ₸</p>
          </div>
          <div className="w-14 h-14 bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-2xl flex items-center justify-center text-orange-600 shadow-inner">
            <Users size={28} />
          </div>
        </div>
      </div>

      <div className="bg-white border border-zinc-200/60 rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.02)] p-10 h-96 flex flex-col items-center justify-center text-center">
        {totalShifts === 0 ? (
          <>
            <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center mb-4">
              <BarChart3 size={32} className="text-zinc-300" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 mb-2">Нет данных для графиков</h3>
            <p className="text-zinc-500 max-w-sm">Как только мастера начнут открывать и закрывать смены, здесь появится аналитика продаж.</p>
          </>
        ) : (
          <p className="text-zinc-400 font-medium">Здесь будет график продаж (Recharts)</p>
        )}
      </div>
    </div>
  );
}
