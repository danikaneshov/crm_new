'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ClipboardCheck, AlertCircle, Package } from 'lucide-react';
import { getAuditStatus, createInitialAudit, closeAudit } from '@/app/actions/audit';
import { getLocationFromCookies } from '@/app/actions/locations';
import { getSession } from '@/app/actions/auth';

export default function AuditPage() {
  const router = useRouter();
  const [locationId, setLocationId] = useState<string | null>(null);
  const [locationName, setLocationName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [status, setStatus] = useState<any>(null);

  // Формы
  const [tobacco, setTobacco] = useState('');
  const [coal, setCoal] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const init = async () => {
      const session = await getSession();
      if (!session || (session.role !== 'senior_master' && session.role !== 'owner')) {
        router.push('/mini-app');
        return;
      }
      
      const loc = await getLocationFromCookies();
      
      if (!loc.id) {
        router.push('/mini-app/select-location');
        return;
      }

      setLocationId(loc.id);
      setLocationName(loc.name || loc.id);

      fetchStatus(loc.id);
    };
    init();
  }, [router]);

  const fetchStatus = async (locId: string) => {
    setLoading(true);
    const res = await getAuditStatus(locId);
    if (res.error) {
      setError(res.error);
    } else {
      setStatus(res);
    }
    setLoading(false);
  };

  const handleStartAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationId || !tobacco || !coal) return;

    setIsSubmitting(true);
    const res = await createInitialAudit(locationId, Number(tobacco), Number(coal));
    setIsSubmitting(false);

    if (res.error) {
      setError(res.error);
    } else {
      alert('Входная ревизия успешно сохранена!');
      fetchStatus(locationId);
    }
  };

  const handleCloseAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationId || !tobacco || !coal) return;
    
    if (!confirm('Вы уверены, что хотите закрыть ревизию за месяц? Это действие необратимо.')) return;

    setIsSubmitting(true);
    const res = await closeAudit(locationId, Number(tobacco), Number(coal));
    setIsSubmitting(false);

    if (res.error) {
      setError(res.error);
    } else {
      alert('Ревизия за месяц успешно закрыта!');
      setTobacco('');
      setCoal('');
      fetchStatus(locationId);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950">
        <Loader2 className="animate-spin text-amber-500 mb-4" size={32} />
      </div>
    );
  }

  return (
    <div className="p-6 pt-10 min-h-[100dvh] bg-zinc-950 flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Ревизия</h1>
          <p className="text-zinc-400 text-sm mt-1 font-medium">{locationName}</p>
        </div>
        <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center border border-amber-500/20">
          <ClipboardCheck className="text-amber-500" size={24} />
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl flex items-start gap-3 mb-6">
          <AlertCircle size={20} className="shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {status?.status === 'NO_INITIAL_AUDIT' && (
        <div className="animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-amber-500/10 border border-amber-500/20 p-5 rounded-3xl mb-8">
            <h2 className="text-amber-500 font-bold mb-2 text-lg">Входная ревизия</h2>
            <p className="text-amber-200/70 text-sm">На этой точке еще не проводилась входная ревизия. Введите текущие фактические остатки. Это делается один раз!</p>
          </div>

          <form onSubmit={handleStartAudit} className="space-y-4">
            <div className="bg-zinc-900/50 p-5 rounded-3xl border border-zinc-800">
              <label className="block text-sm font-medium text-zinc-400 mb-2">Табак (в граммах)</label>
              <input 
                type="number" 
                required
                value={tobacco}
                onChange={e => setTobacco(e.target.value)}
                placeholder="Например: 12500"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3 text-white focus:border-amber-500 outline-none"
              />
            </div>
            
            <div className="bg-zinc-900/50 p-5 rounded-3xl border border-zinc-800">
              <label className="block text-sm font-medium text-zinc-400 mb-2">Уголь (в штуках)</label>
              <input 
                type="number" 
                required
                value={coal}
                onChange={e => setCoal(e.target.value)}
                placeholder="Например: 840"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3 text-white focus:border-amber-500 outline-none"
              />
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold text-lg py-4 rounded-2xl mt-4 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Сохранение...' : 'Сохранить входную ревизию'}
            </button>
          </form>
        </div>
      )}

      {status?.status === 'ACTIVE_MONTH' && (
        <div className="animate-in fade-in slide-in-from-bottom-4">
          
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-zinc-900/50 p-4 rounded-3xl border border-zinc-800">
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">Продано</p>
              <p className="text-2xl font-black text-white">{status.totalSales} <span className="text-sm font-normal text-zinc-500">шт.</span></p>
            </div>
            <div className="bg-zinc-900/50 p-4 rounded-3xl border border-zinc-800">
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">Ожид. табак</p>
              <p className="text-2xl font-black text-amber-500">{status.expectedTobacco} <span className="text-sm font-normal text-zinc-500">г</span></p>
            </div>
          </div>

          <h3 className="text-white font-bold text-xl mb-4 flex items-center gap-2">
            <Package className="text-zinc-500" size={20} />
            Закрытие месяца
          </h3>

          <form onSubmit={handleCloseAudit} className="space-y-4">
            <div className="bg-zinc-900/50 p-5 rounded-3xl border border-zinc-800 focus-within:border-amber-500/50 transition-colors">
              <label className="block text-sm font-medium text-zinc-400 mb-2">Фактический остаток ТАБАКА (г)</label>
              <input 
                type="number" 
                required
                value={tobacco}
                onChange={e => setTobacco(e.target.value)}
                placeholder={`Ожидается: ${status.expectedTobacco}`}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3 text-white focus:border-amber-500 outline-none"
              />
            </div>
            
            <div className="bg-zinc-900/50 p-5 rounded-3xl border border-zinc-800 focus-within:border-amber-500/50 transition-colors">
              <label className="block text-sm font-medium text-zinc-400 mb-2">Фактический остаток УГЛЯ (шт)</label>
              <input 
                type="number" 
                required
                value={coal}
                onChange={e => setCoal(e.target.value)}
                placeholder={`Ожидается: ${status.expectedCoal}`}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3 text-white focus:border-amber-500 outline-none"
              />
            </div>

            <div className="pt-4 pb-10">
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 font-bold text-lg py-4 rounded-2xl transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Анализ...' : 'Закрыть ревизию за месяц'}
              </button>
              <p className="text-center text-zinc-600 text-xs mt-3">Недостача будет автоматически рассчитана и распределена между мастерами.</p>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
