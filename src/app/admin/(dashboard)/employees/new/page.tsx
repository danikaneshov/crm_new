'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { addEmployee } from '@/app/actions/admin/employees';
import { Loader2, ArrowLeft, User, ShieldCheck, Banknote, Coins } from 'lucide-react';
import Link from 'next/link';

export default function NewEmployeePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const result = await addEmployee(formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push('/admin/employees');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center mb-8">
        <Link href="/admin/employees" className="p-2 mr-4 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors">
          <ArrowLeft size={20} className="text-zinc-600" />
        </Link>
        <div>
          <h1 className="text-3xl font-black text-zinc-900 tracking-tight">Добавить сотрудника</h1>
          <p className="text-zinc-500 mt-1">Добавьте нового мастера в CRM</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm p-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl font-medium border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-bold text-zinc-700 mb-2">
                Имя сотрудника
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User size={20} className="text-zinc-400" />
                </div>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-zinc-900"
                  placeholder="Имя Фамилия"
                />
              </div>
            </div>

            <div>
              <label htmlFor="pin" className="block text-sm font-bold text-zinc-700 mb-2">
                PIN-код <span className="text-zinc-400 font-normal">(4 цифры для входа)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <ShieldCheck size={20} className="text-zinc-400" />
                </div>
                <input
                  type="text"
                  id="pin"
                  name="pin"
                  maxLength={4}
                  pattern="\d{4}"
                  title="Введите 4 цифры"
                  className="w-full pl-11 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-zinc-900 font-mono tracking-widest"
                  placeholder="Оставьте пустым для автогенерации"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-zinc-100">
            <div>
              <label htmlFor="salary_base" className="block text-sm font-bold text-zinc-700 mb-2">
                Базовый оклад (₸)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Banknote size={20} className="text-zinc-400" />
                </div>
                <input
                  type="number"
                  id="salary_base"
                  name="salary_base"
                  defaultValue="5000"
                  className="w-full pl-11 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-zinc-900"
                />
              </div>
            </div>

            <div>
              <label htmlFor="salary_per_sale" className="block text-sm font-bold text-zinc-700 mb-2">
                Ставка за 1 продажу (₸)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Coins size={20} className="text-zinc-400" />
                </div>
                <input
                  type="number"
                  id="salary_per_sale"
                  name="salary_per_sale"
                  defaultValue="500"
                  className="w-full pl-11 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-zinc-900"
                />
              </div>
            </div>
          </div>

          <div className="pt-6 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="mr-2 animate-spin" />
                  Сохранение...
                </>
              ) : (
                'Добавить сотрудника'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
