'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Wallet, Activity, ArrowUpRight, Loader2, MapPin } from 'lucide-react';
import { getEmployeeShifts } from '@/app/actions/shifts';
import { getSession } from '@/app/actions/auth';

export default function HistoryScreen() {
  const router = useRouter();
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [totalSalary, setTotalSalary] = useState(0);

  useEffect(() => {
    getSession().then(session => {
      if (!session) {
        router.push('/mini-app/login');
        return;
      }

      getEmployeeShifts().then(data => {
        setShifts(data);
        
        const sum = data.reduce((acc, shift) => acc + (shift.salary || 0), 0);
        setTotalSalary(sum);
        
        setLoading(false);
      }).catch(err => {
        console.error(err);
        setLoading(false);
      });
    }).catch(err => {
      console.error(err);
      router.push('/mini-app/login');
    });
  }, [router]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-zinc-950">
        <Loader2 className="animate-spin text-indigo-500 mb-4" size={32} />
      </div>
    );
  }

  return (
    <div className="p-6 pt-10 min-h-[100dvh] relative overflow-hidden bg-zinc-950 flex flex-col">
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none -translate-y-1/2"></div>
      
      <h1 className="text-3xl font-black mb-8 text-zinc-100 tracking-tight relative z-10">Моя Зарплата</h1>
      
      <div className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-[2rem] p-8 shadow-[0_20px_40px_rgba(79,70,229,0.2)] relative overflow-hidden mb-10 shrink-0">
        <div className="absolute -right-6 -top-6 text-white/10 blur-[2px]">
          <Wallet size={160} />
        </div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full -ml-10 -mb-10 blur-xl"></div>
        
        <p className="text-indigo-100 font-medium relative z-10 text-sm tracking-wide uppercase">Всего заработано</p>
        <p className="text-5xl font-black text-white mt-2 relative z-10 tracking-tight">{totalSalary.toLocaleString()} ₸</p>
        
        <div className="grid grid-cols-2 gap-4 mt-8 relative z-10">
          <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <p className="text-indigo-200 text-xs font-medium uppercase tracking-wider mb-1">Смен</p>
            <p className="font-bold text-white text-xl">{shifts.length}</p>
          </div>
          <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <p className="text-indigo-200 text-xs font-medium uppercase tracking-wider mb-1">Ревизия</p>
            <p className="font-bold text-white text-xl">0 ₸</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6 relative z-10 shrink-0">
        <h2 className="text-xl font-bold flex items-center tracking-tight text-white">
          <Activity className="mr-3 text-indigo-400" size={20} />
          История смен
        </h2>
      </div>

      <div className="relative z-10 flex-1 pb-20">
        {shifts.length === 0 ? (
          <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/80 rounded-3xl p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center mx-auto mb-4">
              <Wallet size={24} className="text-zinc-500" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">История пуста</h3>
            <p className="text-sm text-zinc-400">У вас пока нет закрытых смен. Как только вы закроете первую смену, она появится здесь.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {shifts.map((shift) => (
              <div key={shift.id} className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800/50 p-4 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm">Точка {shift.location_id}</p>
                    <p className="text-zinc-400 text-xs mt-0.5">
                      {shift.closed_at ? new Date(shift.closed_at).toLocaleDateString('ru-RU') : 'Нет даты'} • {shift.total_sales} продаж
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-emerald-400 text-sm">+{shift.salary} ₸</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
