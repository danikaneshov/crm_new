'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, UserCheck, Settings, ArrowRight } from 'lucide-react';
import { getSession } from '@/app/actions/auth';
import Link from 'next/link';

export default function OwnerMenuPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSession().then(session => {
      if (!session) {
        router.push('/mini-app/login');
      } else if (session.role !== 'owner') {
        router.push('/mini-app/select-location');
      } else {
        setLoading(false);
      }
    });
  }, [router]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-6 flex flex-col justify-center relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none -mt-20 -mr-20"></div>
      
      <div className="relative z-10 w-full max-w-sm mx-auto space-y-8">
        <div className="text-center">
          <div className="w-20 h-20 bg-indigo-500/10 border border-indigo-500/20 rounded-3xl mx-auto flex items-center justify-center mb-6">
            <ShieldCheck className="text-indigo-400" size={32} />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mb-2">Владелец</h1>
          <p className="text-zinc-400 text-sm">Выберите режим работы приложения</p>
        </div>

        <div className="space-y-4">
          <Link 
            href="/mini-app/select-location" 
            className="flex items-center justify-between bg-zinc-900/50 border border-zinc-800 p-5 rounded-2xl hover:border-amber-500/50 hover:bg-zinc-900 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-500">
                <UserCheck size={20} />
              </div>
              <div className="text-left">
                <p className="text-white font-bold text-sm">Старший КМ</p>
                <p className="text-zinc-500 text-xs mt-0.5">Работа с точками и ревизии</p>
              </div>
            </div>
            <ArrowRight size={20} className="text-zinc-600 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
          </Link>

          <Link 
            href="/admin" 
            className="flex items-center justify-between bg-zinc-900/50 border border-zinc-800 p-5 rounded-2xl hover:border-indigo-500/50 hover:bg-zinc-900 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-400">
                <Settings size={20} />
              </div>
              <div className="text-left">
                <p className="text-white font-bold text-sm">Админ Панель</p>
                <p className="text-zinc-500 text-xs mt-0.5">Управление всем бизнесом</p>
              </div>
            </div>
            <ArrowRight size={20} className="text-zinc-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
          </Link>
        </div>
      </div>
    </div>
  );
}
