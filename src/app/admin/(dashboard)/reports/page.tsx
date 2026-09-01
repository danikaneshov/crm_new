import { adminDb } from '@/lib/firebase/admin';
import { getAdminSession } from '@/app/actions/adminAuth';
import { redirect } from 'next/navigation';
import { FileBarChart, TrendingUp, DollarSign } from 'lucide-react';

export default async function ReportsPage() {
  const session = await getAdminSession();
  if (!session) redirect('/admin/login');

  // Получаем смены за последний месяц (упрощенно)
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  const snapshot = await adminDb.collection('shifts')
    .where('status', '==', 'CLOSED')
    .where('closed_at', '>=', oneMonthAgo)
    .get();

  const shifts = snapshot.docs.map(doc => doc.data());

  let totalSales = 0;
  let totalPayroll = 0;
  let totalHookahs = 0;
  let totalReplacements = 0;

  const masterStats: Record<string, { name: string; sales: number; payroll: number; shiftsCount: number }> = {};
  const locationStats: Record<string, { sales: number; payroll: number; shiftsCount: number }> = {};

  const employeesSnap = await adminDb.collection('employees').get();
  const empMap: Record<string, string> = {};
  employeesSnap.docs.forEach(doc => {
    empMap[doc.id] = doc.data().name;
  });

  shifts.forEach(shift => {
    const hookahs = shift.hookahs || 0;
    const replacements = shift.replacements || 0;
    const sales = hookahs + replacements;
    const locId = shift.location_id;
    
    totalSales += sales;
    totalHookahs += hookahs;
    totalReplacements += replacements;
    
    if (!locationStats[locId]) {
      locationStats[locId] = { sales: 0, payroll: 0, shiftsCount: 0 };
    }
    locationStats[locId].sales += sales;
    locationStats[locId].shiftsCount += 1;

    // Считаем зп первого мастера
    if (shift.first_master_id) {
      const mId = shift.first_master_id;
      const mName = empMap[mId] || 'Неизвестно';
      const mSalary = shift.first_master_salary || 0;
      
      if (!masterStats[mId]) masterStats[mId] = { name: mName, sales: 0, payroll: 0, shiftsCount: 0 };
      
      masterStats[mId].sales += (shift.type === 'duo' ? Math.ceil(sales / 2) : sales);
      masterStats[mId].payroll += mSalary;
      masterStats[mId].shiftsCount += 1;
      
      totalPayroll += mSalary;
      locationStats[locId].payroll += mSalary;
    }

    // Считаем зп второго мастера (если есть)
    if (shift.second_master_id) {
      const mId = shift.second_master_id;
      const mName = empMap[mId] || 'Неизвестно';
      const mSalary = shift.second_master_salary || 0;
      
      if (!masterStats[mId]) masterStats[mId] = { name: mName, sales: 0, payroll: 0, shiftsCount: 0 };
      
      masterStats[mId].sales += Math.floor(sales / 2);
      masterStats[mId].payroll += mSalary;
      masterStats[mId].shiftsCount += 1;
      
      totalPayroll += mSalary;
      locationStats[locId].payroll += mSalary;
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white tracking-tight">Отчеты и Аналитика</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/80 rounded-3xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center">
              <TrendingUp className="text-indigo-400" size={24} />
            </div>
            <div>
              <p className="text-zinc-400 font-medium">Продажи (месяц)</p>
              <h2 className="text-2xl font-bold text-white">{totalSales} шт</h2>
            </div>
          </div>
          <p className="text-sm text-zinc-500">Кальяны: {totalHookahs}, Замены: {totalReplacements}</p>
        </div>

        <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/80 rounded-3xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <DollarSign className="text-blue-400" size={24} />
            </div>
            <div>
              <p className="text-zinc-400 font-medium">Фонд ЗП (месяц)</p>
              <h2 className="text-2xl font-bold text-white">{totalPayroll.toLocaleString('ru-RU')} ₸</h2>
            </div>
          </div>
        </div>
        
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/80 rounded-3xl p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <FileBarChart className="text-emerald-400" size={24} />
            </div>
            <div>
              <p className="text-zinc-400 font-medium">Закрытых смен</p>
              <h2 className="text-2xl font-bold text-white">{shifts.length}</h2>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/80 rounded-3xl p-6">
          <h2 className="text-xl font-bold text-white mb-6">Зарплаты сотрудников (Payroll)</h2>
          <div className="space-y-4">
            {Object.values(masterStats).sort((a, b) => b.payroll - a.payroll).map(stat => (
              <div key={stat.name} className="flex justify-between items-center p-4 bg-zinc-950/50 rounded-2xl border border-zinc-800/50">
                <div>
                  <p className="font-bold text-zinc-200">{stat.name}</p>
                  <p className="text-xs text-zinc-500">Смен: {stat.shiftsCount}, Продаж: {stat.sales}</p>
                </div>
                <div className="font-bold text-indigo-400">{stat.payroll.toLocaleString('ru-RU')} ₸</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/80 rounded-3xl p-6">
          <h2 className="text-xl font-bold text-white mb-6">Статистика по точкам</h2>
          <div className="space-y-4">
            {Object.entries(locationStats).map(([locName, stat]) => (
              <div key={locName} className="flex justify-between items-center p-4 bg-zinc-950/50 rounded-2xl border border-zinc-800/50">
                <div>
                  <p className="font-bold text-zinc-200">{locName}</p>
                  <p className="text-xs text-zinc-500">Смен: {stat.shiftsCount}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-blue-400">{stat.sales} шт</p>
                  <p className="text-xs text-zinc-500">ЗП: {stat.payroll.toLocaleString()} ₸</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
