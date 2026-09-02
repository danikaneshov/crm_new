import { adminDb } from '@/lib/firebase/admin';
import { notFound } from 'next/navigation';
import LocationSettingsForm from './LocationSettingsForm';
import { MapPin } from 'lucide-react';
import Link from 'next/link';

async function getLocation(id: string) {
  const doc = await adminDb.collection('locations').doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as any;
}

export default async function EditLocationPage({ params }: { params: { id: string } }) {
  const location = await getLocation(params.id);

  if (!location) {
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      <div className="flex items-center gap-4">
        <Link href="/admin/locations" className="p-2 bg-zinc-900/50 border border-zinc-800 rounded-xl hover:bg-zinc-800 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400"><path d="m15 18-6-6 6-6"/></svg>
        </Link>
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <MapPin className="text-indigo-400" /> Настройки точки
          </h1>
          <p className="text-zinc-400 mt-1">{location.name}</p>
        </div>
      </div>

      <LocationSettingsForm location={location} />
    </div>
  );
}
