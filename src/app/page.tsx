import Link from 'next/link';
import { ShieldAlert, TerminalSquare, Smartphone, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-[100dvh] bg-zinc-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Мягкое свечение на фоне */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      
      <div className="max-w-md w-full relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 mb-6 shadow-2xl shadow-indigo-500/20">
            <TerminalSquare size={32} className="text-white" />
          </div>
          <h1 className="text-4xl font-black text-white mb-3 tracking-tight">Hookah CRM</h1>
          <p className="text-zinc-400 text-lg">Единая экосистема управления кальянным бизнесом</p>
        </div>
        
        <div className="space-y-4">
          <Link 
            href="/admin"
            className="group block w-full bg-zinc-900/50 backdrop-blur-md border border-zinc-800 p-6 rounded-2xl hover:bg-zinc-800/80 hover:border-zinc-700 transition-all active:scale-[0.98]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center text-blue-400 group-hover:text-blue-300 group-hover:bg-blue-400/10 transition-colors">
                  <ShieldAlert size={24} />
                </div>
                <div className="text-left">
                  <h2 className="text-white font-bold text-lg">Панель Владельца</h2>
                  <p className="text-zinc-500 text-sm mt-1">Аналитика, сотрудники и ревизии</p>
                </div>
              </div>
              <ArrowRight className="text-zinc-600 group-hover:text-white transition-colors" size={20} />
            </div>
          </Link>
          
          <Link 
            href="/mini-app"
            className="group block w-full bg-gradient-to-br from-indigo-500/10 to-blue-600/10 backdrop-blur-md border border-indigo-500/20 p-6 rounded-2xl hover:bg-indigo-500/20 hover:border-indigo-500/40 transition-all active:scale-[0.98]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:text-indigo-300 group-hover:bg-indigo-400/20 transition-colors">
                  <Smartphone size={24} />
                </div>
                <div className="text-left">
                  <h2 className="text-white font-bold text-lg">Telegram Mini App</h2>
                  <p className="text-indigo-200/50 text-sm mt-1">Рабочий интерфейс мастеров</p>
                </div>
              </div>
              <ArrowRight className="text-indigo-500/50 group-hover:text-indigo-400 transition-colors" size={20} />
            </div>
          </Link>
        </div>
        
      </div>
    </div>
  );
}
