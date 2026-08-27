import { adminDb } from '@/lib/firebase/admin';
import { Users, Plus, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { addEmployee, deleteEmployee, toggleEmployeeActive } from '@/app/actions/admin/employees';

async function getEmployees() {
  try {
    const snapshot = await adminDb.collection('employees').orderBy('created_at', 'desc').get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[];
  } catch (error) {
    console.error(error);
    return [];
  }
}

async function getLocations() {
  try {
    const snapshot = await adminDb.collection('locations').where('is_active', '==', true).get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      address: doc.data().address
    }));
  } catch (error) {
    return [];
  }
}

export default async function AdminEmployeesPage() {
  const employees = await getEmployees();
  const locations = await getLocations();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight mb-2">Сотрудники</h1>
          <p className="text-zinc-400">Управление мастерами и их правами доступа</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Форма добавления */}
        <div className="xl:col-span-1">
          <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/80 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[40px] pointer-events-none"></div>
            
            <h2 className="text-xl font-bold text-white mb-6 relative z-10 flex items-center gap-2">
              <Plus className="text-blue-400" />
              Добавить сотрудника
            </h2>
            
            <form action={addEmployee} className="space-y-4 relative z-10">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2 ml-1">Имя</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Иван Иванов"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-blue-500 transition-all font-medium"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2 ml-1">Telegram ID</label>
                <input
                  type="text"
                  name="telegramId"
                  required
                  placeholder="123456789"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-blue-500 transition-all font-medium"
                />
                <p className="text-[10px] text-zinc-500 ml-1 mt-1">ID можно узнать через бота @userinfobot</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2 ml-1">Роль</label>
                  <select
                    name="role"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-blue-500 transition-all font-medium appearance-none"
                  >
                    <option value="master">КМ (Мастер)</option>
                    <option value="senior_master">Старший КМ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2 ml-1">Оклад за выход</label>
                  <input
                    type="number"
                    name="salaryBase"
                    defaultValue="5000"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-blue-500 transition-all font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2 ml-1">Ставка за 1 кальян</label>
                <input
                  type="number"
                  name="salaryPerSale"
                  defaultValue="1000"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-blue-500 transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2 ml-1">Доступ к точкам</label>
                <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 max-h-48 overflow-y-auto space-y-2">
                  {locations.length === 0 ? (
                    <p className="text-sm text-zinc-500">Нет активных точек</p>
                  ) : (
                    locations.map((loc) => (
                      <label key={loc.id} className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative flex items-center">
                          <input type="checkbox" name="locations" value={loc.name} className="peer sr-only" />
                          <div className="w-5 h-5 bg-zinc-900 border-2 border-zinc-700 rounded flex items-center justify-center peer-checked:bg-blue-500 peer-checked:border-blue-500 transition-all">
                            <CheckCircle2 size={14} className="text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                          </div>
                        </div>
                        <span className="text-sm text-zinc-300 group-hover:text-white transition-colors">{loc.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold py-4 rounded-2xl shadow-lg transition-all active:scale-[0.98] mt-2"
              >
                Добавить
              </button>
            </form>
          </div>
        </div>

        {/* Список сотрудников */}
        <div className="xl:col-span-2">
          <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/80 rounded-3xl p-6 shadow-2xl overflow-x-auto">
            <div className="flex items-center gap-2 mb-6">
              <Users className="text-blue-400" />
              <h2 className="text-xl font-bold text-white">Список мастеров ({employees.length})</h2>
            </div>
            
            {employees.length === 0 ? (
              <div className="text-center py-10 text-zinc-500">
                <Users className="mx-auto h-10 w-10 mb-3 opacity-20" />
                <p>Сотрудники еще не добавлены</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="pb-3 text-sm font-medium text-zinc-400 pl-4">Сотрудник</th>
                    <th className="pb-3 text-sm font-medium text-zinc-400">Ставки</th>
                    <th className="pb-3 text-sm font-medium text-zinc-400">Точки</th>
                    <th className="pb-3 text-sm font-medium text-zinc-400 text-right pr-4">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {employees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-zinc-800/20 transition-colors group">
                      <td className="py-4 pl-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold">
                            {emp.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-white">{emp.name}</p>
                              {emp.role === 'senior_master' && (
                                <span className="bg-amber-500/20 text-amber-400 text-[9px] uppercase px-2 py-0.5 rounded-full font-bold">Старший</span>
                              )}
                            </div>
                            <p className="text-[10px] text-zinc-500 font-mono mt-0.5">ID: {emp.telegram_id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 align-top pt-5">
                        <div className="text-sm">
                          <p className="text-zinc-300">Оклад: <span className="text-white font-medium">{emp.salary_base}</span></p>
                          <p className="text-zinc-300">За 1 ед: <span className="text-white font-medium">{emp.salary_per_sale}</span></p>
                        </div>
                      </td>
                      <td className="py-4 align-top pt-5">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {(emp.location_ids || []).map((locId: string) => (
                            <span key={locId} className="bg-zinc-800 text-zinc-300 text-[10px] px-2 py-1 rounded-md border border-zinc-700">
                              {locId}
                            </span>
                          ))}
                          {(!emp.location_ids || emp.location_ids.length === 0) && (
                            <span className="text-sm text-zinc-600">Нет доступа</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 pr-4 align-top pt-4">
                        <div className="flex items-center justify-end gap-2">
                          <form action={async () => {
                            'use server';
                            await toggleEmployeeActive(emp.id, emp.is_active);
                          }}>
                            <button type="submit" className={`p-2 rounded-xl transition-all ${emp.is_active ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-zinc-500 hover:bg-emerald-500/10 hover:text-emerald-400'}`} title={emp.is_active ? 'Деактивировать' : 'Активировать'}>
                              {emp.is_active ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                            </button>
                          </form>
                          
                          <form action={async () => {
                            'use server';
                            await deleteEmployee(emp.id);
                          }}>
                            <button type="submit" className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all" title="Удалить">
                              <Trash2 size={20} />
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
