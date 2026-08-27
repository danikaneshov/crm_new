import { getAdminSession, logoutAdmin } from '@/app/actions/adminAuth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Users, MapPin, ClipboardList, LogOut } from 'lucide-react';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();
  
  if (!session) {
    redirect('/admin/login');
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex text-zinc-100 selection:bg-indigo-500/30">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 bg-zinc-900/50 backdrop-blur-2xl border-r border-zinc-800/80 flex-col relative z-20">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center font-bold text-white shadow-lg">
              C
            </div>
            <span className="font-bold text-lg tracking-tight text-white">Hookah CRM</span>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-6">
          <NavItem href="/admin" icon={<LayoutDashboard size={20} />} label="Дашборд" />
          <NavItem href="/admin/shifts" icon={<ClipboardList size={20} />} label="Смены" />
          <NavItem href="/admin/employees" icon={<Users size={20} />} label="Сотрудники" />
          <NavItem href="/admin/locations" icon={<MapPin size={20} />} label="Точки" />
        </nav>

        <div className="p-4 mt-auto">
          <form action={async () => {
            'use server';
            await logoutAdmin();
            redirect('/admin/login');
          }}>
            <button className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all w-full text-left">
              <LogOut size={20} />
              Выйти
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 relative overflow-y-auto pb-24 md:pb-0">
        {/* Soft background glow */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none -mr-40 -mt-40 z-0"></div>
        <div className="relative z-10 p-4 md:p-8">
          {children}
        </div>
      </main>

      {/* Bottom Navigation (Mobile only) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-zinc-900/80 backdrop-blur-xl border-t border-zinc-800/50 pb-safe shadow-[0_-8px_30px_rgba(0,0,0,0.12)] z-50">
        <div className="flex justify-around items-center p-2">
          <MobileNavItem href="/admin" icon={<LayoutDashboard size={22} />} label="Дашборд" />
          <MobileNavItem href="/admin/shifts" icon={<ClipboardList size={22} />} label="Смены" />
          <MobileNavItem href="/admin/employees" icon={<Users size={22} />} label="Сотрудники" />
          <MobileNavItem href="/admin/locations" icon={<MapPin size={22} />} label="Точки" />
        </div>
      </nav>
    </div>
  );
}

function NavItem({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link 
      href={href} 
      className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-zinc-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-xl transition-all group"
    >
      <div className="text-zinc-500 group-hover:text-indigo-400 transition-colors">
        {icon}
      </div>
      {label}
    </Link>
  );
}

function MobileNavItem({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href} className="flex flex-col items-center p-2 text-zinc-500 hover:text-indigo-400 transition-colors group">
      <div className="mb-1 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <span className="text-[10px] uppercase tracking-wider font-medium">{label}</span>
    </Link>
  );
}
