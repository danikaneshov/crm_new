'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loginWithTelegramInitData, loginWithTelegramIdDev } from '@/app/actions/auth';
import { Loader2, MessageCircle, ArrowRight, ShieldCheck, Terminal } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [telegramId, setTelegramId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDevLogin, setShowDevLogin] = useState(false);

  useEffect(() => {
    let retries = 0;
    
    // Пытаемся автоматически залогиниться через Telegram
    const initTelegramAuth = async () => {
      // @ts-ignore
      const tg = window?.Telegram?.WebApp;
      
      // Ждем пока SDK загрузится (максимум 2 секунды)
      if (!tg?.initData && retries < 10) {
        retries++;
        setTimeout(initTelegramAuth, 200);
        return;
      }

      if (tg && tg.initData) {
        try {
          const startParam = tg.initDataUnsafe?.start_param;
          const result = await loginWithTelegramInitData(tg.initData, startParam);
          if ('success' in result && result.success) {
            if (startParam) {
              localStorage.setItem('consumed_start_param', startParam);
            }
            if (result.employee?.role === 'owner') {
              router.push('/mini-app/owner');
            } else {
              router.push('/mini-app/select-location');
            }
          } else {
            setError(result.error || 'Ошибка авторизации Telegram');
            setLoading(false);
          }
        } catch (e) {
          setError('Сбой связи с сервером');
          setLoading(false);
        }
      } else {
        // Если мы не в Telegram, показываем Dev-режим
        setLoading(false);
        setShowDevLogin(true);
      }
    };

    initTelegramAuth();
  }, [router]);

  const handleDevLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await loginWithTelegramIdDev(telegramId);
    
    if ('error' in result && result.error) {
      setError(result.error);
      setLoading(false);
    } else if ('success' in result && result.success) {
      if (result.employee?.role === 'owner') {
        router.push('/mini-app/owner');
      } else {
        router.push('/mini-app/select-location');
      }
    }
  };

  return (
    <div className="min-h-[100dvh] p-6 flex flex-col items-center justify-center relative overflow-hidden bg-zinc-950">
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none -mt-20 -mr-20"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none -mb-20 -ml-20"></div>
      
      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-3xl mx-auto flex items-center justify-center mb-6 shadow-2xl relative overflow-hidden">
            {loading ? (
               <Loader2 className="text-indigo-400 animate-spin" size={32} />
            ) : showDevLogin ? (
               <Terminal className="text-amber-400" size={32} />
            ) : (
               <ShieldCheck className="text-emerald-400" size={32} />
            )}
          </div>
          
          {loading ? (
            <>
              <h1 className="text-3xl font-black text-white tracking-tight mb-2">Запуск...</h1>
              <p className="text-zinc-400 text-sm">Проверка безопасности Telegram</p>
            </>
          ) : showDevLogin ? (
            <>
              <h1 className="text-3xl font-black text-white tracking-tight mb-2">Dev Mode</h1>
              <p className="text-zinc-400 text-sm">Приложение запущено вне Telegram. Введите ваш ID.</p>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-black text-white tracking-tight mb-2">Авторизация</h1>
              <p className="text-zinc-400 text-sm">Проверка ваших прав...</p>
            </>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 text-red-400 rounded-2xl font-medium border border-red-500/20 text-sm text-center">
            {error}
          </div>
        )}

        {showDevLogin && !loading && (
          <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/80 rounded-[2rem] p-6 shadow-2xl">
            <form onSubmit={handleDevLogin} className="space-y-6">
              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-zinc-500 font-bold">ID</span>
                  </div>
                  <input
                    type="text"
                    value={telegramId}
                    onChange={(e) => setTelegramId(e.target.value)}
                    placeholder="Например: 12345"
                    required
                    className="w-full pl-12 pr-4 py-4 bg-black/20 border border-white/10 rounded-2xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium text-white placeholder:text-zinc-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-600 hover:bg-amber-500 text-white py-4 rounded-2xl font-bold transition-all shadow-[0_0_20px_rgba(217,119,6,0.3)] flex items-center justify-center group active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Войти (Dev)
                <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
