import { Activity, TrendingUp, Users, AlertCircle } from 'lucide-react';
import { adminDb } from '@/lib/firebase/admin';

async function getDashboardStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    // 1. Активные смены
    const activeShiftsSnap = await adminDb.collection('shifts')
      .where('status', '==', 'OPEN')
      .get();
    
    // 2. Смены, требующие проверки
    const needsReviewSnap = await adminDb.collection('shifts')
      .where('status', '==', 'NEEDS_REVIEW')
      .get();
      
    // 3. Сотрудники
    const employeesSnap = await adminDb.collection('employees')
      .where('is_active', '==', true)
      .get();

    // 4. Продажи за сегодня (упрощенно - все закрытые сегодня смены)
    // В реальном проекте лучше использовать индексы по дате
    
    return {
      activeShifts: activeShiftsSnap.size,
      needsReview: needsReviewSnap.size,
      totalEmployees: employeesSnap.size,
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return {
      activeShifts: 0,
      needsReview: 0,
      totalEmployees: 0,
    };
  }
}

export default async function AdminDashboard() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight mb-2">Дашборд</h1>
        <p className="text-zinc-400">Сводка по всем точкам на сегодня</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Карточка 1 */}
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/80 rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-[40px] group-hover:bg-indigo-500/20 transition-colors"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400">
              <Activity size={24} />
            </div>
          </div>
          <div className="relative z-10">
            <p className="text-sm font-medium text-zinc-500 mb-1">Активные смены</p>
            <h3 className="text-3xl font-black text-white">{stats.activeShifts}</h3>
          </div>
        </div>

        {/* Карточка 2 */}
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/80 rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-[40px] group-hover:bg-amber-500/20 transition-colors"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-400">
              <AlertCircle size={24} />
            </div>
          </div>
          <div className="relative z-10">
            <p className="text-sm font-medium text-zinc-500 mb-1">Требуют проверки</p>
            <h3 className="text-3xl font-black text-white">{stats.needsReview}</h3>
          </div>
        </div>

        {/* Карточка 3 */}
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/80 rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[40px] group-hover:bg-blue-500/20 transition-colors"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400">
              <Users size={24} />
            </div>
          </div>
          <div className="relative z-10">
            <p className="text-sm font-medium text-zinc-500 mb-1">Сотрудники</p>
            <h3 className="text-3xl font-black text-white">{stats.totalEmployees}</h3>
          </div>
        </div>

        {/* Карточка 4 */}
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/80 rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[40px] group-hover:bg-emerald-500/20 transition-colors"></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400">
              <TrendingUp size={24} />
            </div>
          </div>
          <div className="relative z-10">
            <p className="text-sm font-medium text-zinc-500 mb-1">Динамика</p>
            <h3 className="text-3xl font-black text-white">+12%</h3>
          </div>
        </div>
      </div>
    </div>
  );
}
