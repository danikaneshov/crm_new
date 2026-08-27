'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Map, Loader2 } from 'lucide-react';
import { getActiveLocations } from '@/app/actions/locations';
import { getSession } from '@/app/actions/auth';

export default function SelectLocation() {
  const router = useRouter();
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [employeeName, setEmployeeName] = useState<string | null>(null);

  useEffect(() => {
    // Получаем сессию с сервера
    getSession().then(session => {
      if (!session) {
        router.push('/mini-app/login');
        return;
      }
      
      setEmployeeName(session.name);

      // Загрузка локаций
      getActiveLocations().then(data => {
        if (data.error) {
          router.push('/mini-app/login');
          return;
        }
        setLocations(data.locations || []);
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

  const handleSelect = (id: string, name: string) => {
    // Локация остается в localStorage, так как это просто UI состояние
    localStorage.setItem('selectedLocation', id);
    localStorage.setItem('selectedLocationName', name);
    router.push('/mini-app');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950">
        <Loader2 className="animate-spin text-indigo-500 mb-4" size={32} />
        <p className="text-zinc-500 font-medium">Загрузка точек...</p>
      </div>
    );
  }

  return (
    <div className="p-6 pt-12 max-w-md mx-auto relative min-h-screen flex flex-col bg-zinc-950">
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none -mr-20 -mt-20"></div>
      
      <div className="text-center mb-10 relative z-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-zinc-900/50 backdrop-blur-md border border-zinc-800 shadow-xl mb-6">
          <Map className="text-indigo-400" size={28} />
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight mb-2">Привет, {employeeName}!</h1>
        <p className="text-zinc-400">Где вы сегодня работаете?</p>
      </div>

      <div className="flex-1 space-y-4 relative z-10">
        {locations.length === 0 ? (
          <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/80 rounded-3xl p-8 text-center mt-8">
            <div className="w-16 h-16 rounded-full bg-zinc-800/50 flex items-center justify-center mx-auto mb-4">
              <MapPin size={24} className="text-zinc-500" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Нет доступных точек</h3>
            <p className="text-sm text-zinc-400">В системе еще не создано ни одного заведения.</p>
          </div>
        ) : (
          locations.map((loc) => (
            <button
              key={loc.id}
              onClick={() => handleSelect(loc.id, loc.name)}
              className="group w-full p-6 bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/80 rounded-3xl text-lg font-medium hover:bg-zinc-800/80 transition-all active:scale-95 flex items-center justify-between shadow-lg"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors">
                  <MapPin className="text-indigo-400" size={20} />
                </div>
                <span className="text-zinc-200">{loc.name}</span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
