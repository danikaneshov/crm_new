import { Home, Wallet, ClipboardCheck } from 'lucide-react';
import { getSession } from '@/app/actions/auth';

export default async function MiniAppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  return (
    <>
      <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-20 relative overflow-hidden">
        {/* Мягкие блики на фоне */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none translate-x-1/2 translate-y-1/2"></div>
        
        <div className="relative z-10">
          {children}
        </div>
        
        <nav className="fixed bottom-0 left-0 w-full bg-zinc-900/80 backdrop-blur-xl border-t border-zinc-800/50 p-4 pb-8 flex justify-around shadow-[0_-8px_30px_rgba(0,0,0,0.12)] z-50">
          <a href="/mini-app" className="flex flex-col items-center text-sm font-medium text-zinc-500 hover:text-indigo-400 transition-colors group">
            <Home size={24} className="mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] uppercase tracking-wider">Смена</span>
          </a>
          <a href="/mini-app/history" className="flex flex-col items-center text-sm font-medium text-zinc-500 hover:text-blue-400 transition-colors group">
            <Wallet size={24} className="mb-1 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] uppercase tracking-wider">Зарплата</span>
          </a>
          {session?.role === 'senior_master' && (
            <a href="/mini-app/audit" className="flex flex-col items-center text-sm font-medium text-zinc-500 hover:text-amber-400 transition-colors group">
              <ClipboardCheck size={24} className="mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] uppercase tracking-wider">Ревизия</span>
            </a>
          )}
        </nav>
      </div>
    </>
  );
}
