'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginWithPin } from '@/app/actions/auth';
import { Loader2, ShieldCheck, Delete } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePinClick = async (digit: string) => {
    if (loading) return;
    
    const newPin = pin.length < 4 ? pin + digit : pin;
    setPin(newPin);
    
    if (newPin.length === 4) {
      setLoading(true);
      setError('');

      const result = await loginWithPin(newPin);
      
      if (result.error) {
        setError(result.error);
        setPin('');
        setLoading(false);
      } else if (result.success) {
        if (result.employee?.role === 'owner') {
          router.push('/mini-app/owner');
        } else {
          router.push('/mini-app/select-location');
        }
      }
    }
  };

  const handleDelete = () => {
    if (loading) return;
    setPin(pin.slice(0, -1));
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

        <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/80 rounded-[2rem] p-6 shadow-2xl flex flex-col items-center">
          
          {/* PIN Indicators */}
          <div className="flex gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div 
                key={i}
                className={`w-4 h-4 rounded-full transition-all duration-300 ${
                  i < pin.length 
                    ? 'bg-indigo-500 scale-110 shadow-[0_0_15px_rgba(99,102,241,0.6)]' 
                    : 'bg-zinc-800 scale-100'
                }`}
              />
            ))}
          </div>

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-4 w-full max-w-[260px]">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
              <button
                key={digit}
                onClick={() => handlePinClick(digit.toString())}
                disabled={loading}
                className="h-16 rounded-2xl bg-zinc-800/50 hover:bg-zinc-700 active:bg-zinc-600 text-white text-2xl font-bold transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {digit}
              </button>
            ))}
            <div className="h-16"></div> {/* Пустая клетка */}
            <button
              onClick={() => handlePinClick('0')}
              disabled={loading}
              className="h-16 rounded-2xl bg-zinc-800/50 hover:bg-zinc-700 active:bg-zinc-600 text-white text-2xl font-bold transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              0
            </button>
            <button
              onClick={handleDelete}
              disabled={loading || pin.length === 0}
              className="h-16 rounded-2xl bg-zinc-800/50 hover:bg-zinc-700 active:bg-zinc-600 text-zinc-400 hover:text-white transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              <Delete size={24} />
            </button>
          </div>
          
          {loading && (
            <div className="mt-6 flex items-center text-indigo-400 font-medium animate-pulse">
              <Loader2 className="animate-spin mr-2" size={20} />
              Проверка...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
