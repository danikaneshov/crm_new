'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginWithPin } from '@/app/actions/auth';
import { Loader2, ArrowRight, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 4) {
      setError('PIN должен состоять из 4 цифр');
      return;
    }
    setLoading(true);
    setError('');

    const result = await loginWithPin(pin);
    
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else if (result.success) {
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
            <ShieldCheck className="text-indigo-400" size={32} />
          </div>
          
          <h1 className="text-3xl font-black text-white tracking-tight mb-2">Авторизация</h1>
          <p className="text-zinc-400 text-sm">Введите ваш персональный PIN-код</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 text-red-400 rounded-2xl font-medium border border-red-500/20 text-sm text-center">
            {error}
          </div>
        )}

        <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/80 rounded-[2rem] p-6 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                required
                className="w-full text-center text-4xl tracking-[1em] py-6 bg-black/20 border border-white/10 rounded-2xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-bold text-white placeholder:text-zinc-700"
              />
            </div>

            <button
              type="submit"
              disabled={loading || pin.length !== 4}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-2xl font-bold transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] flex items-center justify-center group active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={24} />
              ) : (
                <>
                  Войти
                  <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
