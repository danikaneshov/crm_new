'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateLocation } from '@/app/actions/admin/locations';
import { Loader2, Save, Settings, BrainCircuit, Wallet } from 'lucide-react';

export default function LocationSettingsForm({ location }: { location: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [overrideSalaries, setOverrideSalaries] = useState(location.override_salaries || false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const result = await updateLocation(location.id, formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push('/admin/locations');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
      {error && (
        <div className="p-4 bg-red-500/10 text-red-400 rounded-2xl font-medium border border-red-500/20 text-sm">
          {error}
        </div>
      )}

      {/* Basic Settings */}
      <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/80 rounded-3xl p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Settings className="text-blue-400" /> Основные настройки
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2 ml-1">Название (ID)</label>
            <input
              type="text"
              name="name"
              defaultValue={location.name}
              required
              className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500 transition-all font-medium"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2 ml-1">Адрес</label>
            <input
              type="text"
              name="address"
              defaultValue={location.address}
              required
              className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500 transition-all font-medium"
            />
          </div>
        </div>
      </div>

      {/* AI Prompts Settings */}
      <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/80 rounded-3xl p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <BrainCircuit className="text-purple-400" /> Настройки AI (Распознавание чека)
        </h2>
        <p className="text-zinc-500 text-sm mb-6">Если r_keeper на этой точке печатает особые слова для кальянов, укажите их здесь.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2 ml-1">Ключевое слово для Кальяна</label>
            <input
              type="text"
              name="hookah_keyword"
              defaultValue={location.hookah_keyword || 'кальян'}
              placeholder="Например: дымный коктейль"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-purple-500 transition-all font-medium"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2 ml-1">Ключевое слово для Замены</label>
            <input
              type="text"
              name="replacement_keyword"
              defaultValue={location.replacement_keyword || 'замена'}
              placeholder="Например: дымный коктейль 2"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-purple-500 transition-all font-medium"
            />
          </div>
        </div>
      </div>

      {/* Salary Overrides */}
      <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/80 rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Wallet className="text-emerald-400" /> Спец. зарплаты для точки
          </h2>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              name="override_salaries" 
              className="sr-only peer" 
              checked={overrideSalaries}
              onChange={(e) => setOverrideSalaries(e.target.checked)}
            />
            <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
          </label>
        </div>
        
        {overrideSalaries ? (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <p className="text-zinc-500 text-sm">Если включено, базовая зарплата сотрудника будет игнорироваться, и будут применяться эти настройки.</p>
            
            <div>
              <label className="flex items-center gap-3 cursor-pointer group mb-6 p-4 bg-zinc-950 border border-zinc-800 rounded-2xl">
                <div className="relative flex items-center">
                  <input 
                    type="checkbox" 
                    name="salary_base_conditional" 
                    defaultChecked={location.salary_base_conditional || false} 
                    className="peer sr-only" 
                  />
                  <div className="w-6 h-6 bg-zinc-900 border-2 border-zinc-700 rounded flex items-center justify-center peer-checked:bg-emerald-500 peer-checked:border-emerald-500 transition-all">
                    <svg className="text-white opacity-0 peer-checked:opacity-100 transition-opacity w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                </div>
                <div>
                  <span className="text-sm font-bold text-zinc-300 group-hover:text-white transition-colors block">Оклад зависит от продаж</span>
                  <span className="text-xs text-zinc-500 block">Если нет продаж за смену - оклад 0 ₸</span>
                </div>
              </label>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2 ml-1">Оклад за смену (₸)</label>
                  <input
                    type="number"
                    name="salary_base"
                    defaultValue={location.salary_base || 0}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-emerald-500 transition-all font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2 ml-1">Ставка за Кальян (₸)</label>
                  <input
                    type="number"
                    name="salary_hookah"
                    defaultValue={location.salary_hookah || 0}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-emerald-500 transition-all font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2 ml-1">Ставка за Замену (₸)</label>
                  <input
                    type="number"
                    name="salary_replacement"
                    defaultValue={location.salary_replacement || 0}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-emerald-500 transition-all font-medium"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-zinc-500 text-sm">Зарплата рассчитывается по базовой ставке сотрудника.</p>
        )}
      </div>

      <div className="pt-4 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-400 hover:to-blue-500 text-white px-10 py-4 rounded-2xl font-bold transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center active:scale-[0.98]"
        >
          {loading ? (
            <Loader2 size={24} className="mr-2 animate-spin" />
          ) : (
            <>
              <Save size={24} className="mr-2" />
              Сохранить настройки
            </>
          )}
        </button>
      </div>
    </form>
  );
}
