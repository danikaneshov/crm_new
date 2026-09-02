import { adminDb } from '@/lib/firebase/admin';
import { MapPin, Plus, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { addLocation, deleteLocation, toggleLocationActive } from '@/app/actions/admin/locations';

async function getLocations() {
  try {
    const snapshot = await adminDb.collection('locations').orderBy('created_at', 'desc').get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[];
  } catch (error) {
    console.error(error);
    return [];
  }
}

export default async function AdminLocationsPage() {
  const locations = await getLocations();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight mb-2">Точки</h1>
          <p className="text-zinc-400">Управление локациями и заведениями</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Форма добавления */}
        <div className="lg:col-span-1">
          <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/80 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-[40px] pointer-events-none"></div>
            
            <h2 className="text-xl font-bold text-white mb-6 relative z-10 flex items-center gap-2">
              <Plus className="text-indigo-400" />
              Добавить точку
            </h2>
            
            <form action={async (fd) => { 'use server'; await addLocation(fd); }} className="space-y-4 relative z-10">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2 ml-1">Название (внутреннее ID)</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Например: pushkin"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500 transition-all font-medium"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2 ml-1">Адрес (для отображения)</label>
                <input
                  type="text"
                  name="address"
                  required
                  placeholder="ул. Пушкина, Колотушкина"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-indigo-500 transition-all font-medium"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-400 hover:to-blue-500 text-white font-bold py-4 rounded-2xl shadow-lg transition-all active:scale-[0.98] mt-2"
              >
                Сохранить
              </button>
            </form>
          </div>
        </div>

        {/* Список локаций */}
        <div className="lg:col-span-2">
          <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/80 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center gap-2 mb-6">
              <MapPin className="text-indigo-400" />
              <h2 className="text-xl font-bold text-white">Список точек ({locations.length})</h2>
            </div>
            
            <div className="space-y-3">
              {locations.length === 0 ? (
                <div className="text-center py-10 text-zinc-500">
                  <MapPin className="mx-auto h-10 w-10 mb-3 opacity-20" />
                  <p>Нет добавленных точек</p>
                </div>
              ) : (
                locations.map((loc) => (
                  <div key={loc.id} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 flex justify-between items-center group transition-all hover:border-zinc-700">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-white">{loc.name}</h3>
                        {loc.is_active ? (
                          <span className="bg-emerald-500/10 text-emerald-400 text-[10px] uppercase font-bold px-2 py-1 rounded-full">Активна</span>
                        ) : (
                          <span className="bg-red-500/10 text-red-400 text-[10px] uppercase font-bold px-2 py-1 rounded-full">Отключена</span>
                        )}
                      </div>
                      <p className="text-sm text-zinc-400 mt-1">{loc.address}</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <form action={async () => {
                        'use server';
                        await toggleLocationActive(loc.id, loc.is_active);
                      }}>
                        <button type="submit" className={`p-2 rounded-xl transition-all ${loc.is_active ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-zinc-500 hover:bg-emerald-500/10 hover:text-emerald-400'}`} title={loc.is_active ? 'Отключить' : 'Включить'}>
                          {loc.is_active ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                        </button>
                      </form>
                      
                      <a href={`/admin/locations/${loc.id}`} className="p-2 text-zinc-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-xl transition-all" title="Настройки">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                      </a>
                      
                      <form action={async () => {
                        'use server';
                        await deleteLocation(loc.id);
                      }}>
                        <button type="submit" className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all" title="Удалить">
                          <Trash2 size={20} />
                        </button>
                      </form>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
