'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Users, User, Moon, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { getCurrentShift, openShift, closeShiftWithImage } from '@/app/actions/shifts';
import { getSession } from '@/app/actions/auth';

export default function ShiftScreen() {
  const router = useRouter();
  const [locationId, setLocationId] = useState<string | null>(null);
  const [locationName, setLocationName] = useState<string | null>(null);
  const [employeeName, setEmployeeName] = useState<string | null>(null);
  
  const [shiftStatus, setShiftStatus] = useState<'CLOSED' | 'OPEN' | 'PROCESSING'>('CLOSED');
  const [currentShiftId, setCurrentShiftId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getSession().then(session => {
      if (!session) {
        router.push('/mini-app/login');
        return;
      }
      setEmployeeName(session.name);

      const locId = localStorage.getItem('selectedLocation');
      const locName = localStorage.getItem('selectedLocationName');

      if (!locId) {
        router.push('/mini-app/select-location');
        return;
      }

      setLocationId(locId);
      setLocationName(locName);

      // Проверяем, есть ли уже открытая смена
      getCurrentShift(locId).then(res => {
        if (res?.shift) {
          setShiftStatus('OPEN');
          setCurrentShiftId(res.shift.id);
        }
        setLoading(false);
      }).catch(err => {
        console.error(err);
        setError('Ошибка при проверке смены. Проверьте соединение.');
        setLoading(false);
      });
    }).catch(err => {
      console.error('Session error:', err);
      setError('Ошибка соединения с сервером. Возможно, CORS блокирует запрос (localtunnel/ngrok).');
      setLoading(false);
    });
  }, [router]);

  const handleOpenShift = async (type: 'solo' | 'duo') => {
    if (!locationId) return;
    
    setLoading(true);
    const result = await openShift(locationId, type);
    
    if (result.error) {
      setError(result.error);
    } else if (result.success && result.shiftId) {
      setCurrentShiftId(result.shiftId);
      setShiftStatus('OPEN');
    }
    setLoading(false);
  };

  const handleTriggerFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentShiftId) return;

    setShiftStatus('PROCESSING');
    setError('');

    // Сжимаем картинку перед отправкой
    const compressImage = (file: File): Promise<Blob> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 1200;
            const MAX_HEIGHT = 1200;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
              (blob) => {
                if (blob) {
                  resolve(blob);
                } else {
                  reject(new Error('Canvas to Blob failed'));
                }
              },
              'image/jpeg',
              0.7 // quality
            );
          };
          img.onerror = () => reject(new Error('Image load failed'));
          img.src = event.target?.result as string;
        };
        reader.onerror = () => reject(new Error('File read failed'));
        reader.readAsDataURL(file);
      });
    };

    try {
      const compressedBlob = await compressImage(file);
      const formData = new FormData();
      formData.append('image', compressedBlob, 'receipt.jpg');

      const result = await closeShiftWithImage(currentShiftId, formData);

      if (result.error) {
        setError(result.error);
        setShiftStatus('OPEN');
      } else {
        setShiftStatus('CLOSED');
        setCurrentShiftId(null);
        alert(`Смена закрыта! Распознано продаж: ${result.sales}. Заработано: ${result.salary} ₸`);
      }
    } catch (err) {
      console.error(err);
      setError('Ошибка при обработке картинки.');
      setShiftStatus('OPEN');
    }
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950">
        <Loader2 className="animate-spin text-indigo-500 mb-4" size={32} />
      </div>
    );
  }

  return (
    <div className="p-6 pt-10 min-h-[100dvh] bg-zinc-950 flex flex-col">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-black bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent tracking-tight">
            {locationName || locationId}
          </h1>
          <p className="text-zinc-400 text-sm mt-1 font-medium">Сегодня, {new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}</p>
        </div>
        <div className="w-12 h-12 bg-zinc-800/80 backdrop-blur-md rounded-2xl flex items-center justify-center border border-zinc-700/50 shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-transparent"></div>
          <User className="text-indigo-400 relative z-10" size={24} />
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl flex items-start gap-3 mb-6">
          <AlertCircle size={20} className="shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {shiftStatus === 'CLOSED' && (
        <div className="flex flex-col items-center justify-center flex-1 space-y-6 animate-in fade-in zoom-in duration-500 pb-20">
          <div className="w-32 h-32 rounded-full bg-blue-500/5 flex items-center justify-center mb-4 relative">
            <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-2xl"></div>
            <div className="w-24 h-24 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center relative z-10 shadow-2xl">
              <Moon className="text-blue-500" size={40} />
            </div>
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Смена закрыта</h2>
            <p className="text-zinc-500 px-4">Откройте новую смену, чтобы начать учет продаж.</p>
          </div>
          
          <div className="flex gap-4 w-full mt-8">
            <button onClick={() => handleOpenShift('solo')} className="flex-1 bg-zinc-900/50 backdrop-blur-md border border-zinc-800/80 p-5 rounded-3xl flex flex-col items-center hover:bg-zinc-800 transition-all active:scale-95 group shadow-lg">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <User className="text-blue-400" size={24} />
              </div>
              <span className="font-semibold text-zinc-300 group-hover:text-white transition-colors">Соло</span>
            </button>
            <button onClick={() => alert('Пока в разработке')} className="flex-1 bg-zinc-900/50 backdrop-blur-md border border-zinc-800/80 p-5 rounded-3xl flex flex-col items-center hover:bg-zinc-800 transition-all active:scale-95 group shadow-lg opacity-50">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Users className="text-indigo-400" size={24} />
              </div>
              <span className="font-semibold text-zinc-300 group-hover:text-white transition-colors">Вдвоем</span>
            </button>
          </div>
        </div>
      )}

      {shiftStatus === 'OPEN' && (
        <div className="flex flex-col mt-10 animate-in fade-in slide-in-from-bottom-8 duration-500">
          <div className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-[2rem] p-8 shadow-[0_20px_40px_rgba(79,70,229,0.2)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-20 -mt-20 blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full -ml-10 -mb-10 blur-xl"></div>
            
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-indigo-100 font-medium text-sm tracking-wide uppercase">Статус</h2>
                  <div className="text-3xl font-black text-white tracking-tight mt-1">В работе</div>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                  <CheckCircle2 className="text-white" size={20} />
                </div>
              </div>
              
              <div className="bg-black/20 rounded-2xl p-4 backdrop-blur-md border border-white/10 flex justify-between items-center">
                <div>
                  <p className="text-indigo-200 text-xs font-medium uppercase tracking-wider mb-1">Вы</p>
                  <p className="font-bold text-white">{employeeName || 'Мастер'}</p>
                </div>
                <div className="w-[1px] h-8 bg-white/20"></div>
                <div className="text-right">
                  <p className="text-indigo-200 text-xs font-medium uppercase tracking-wider mb-1">Напарник</p>
                  <p className="font-bold text-white/50">—</p>
                </div>
              </div>
            </div>
          </div>

          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileChange}
            capture="environment"
          />

          <button 
            onClick={handleTriggerFileSelect}
            className="mt-10 w-full bg-white text-zinc-900 font-bold text-lg py-5 rounded-[2rem] flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:bg-zinc-100 transition-all active:scale-[0.98]"
          >
            <Camera className="mr-3 text-zinc-900" size={24} />
            Загрузить чек закрытия
          </button>
          <p className="text-center text-zinc-500 text-sm mt-6 font-medium">Сфотографируйте чек r_keeper. ИИ автоматически распознает его и посчитает вашу зарплату.</p>
        </div>
      )}

      {shiftStatus === 'PROCESSING' && (
        <div className="flex flex-col items-center justify-center flex-1 animate-in fade-in duration-300 pb-20">
          <div className="relative w-24 h-24 mb-8">
            <div className="absolute inset-0 border-4 border-zinc-800 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-t-indigo-500 rounded-full animate-spin"></div>
            <Camera className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-zinc-400" size={28} />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white mb-2 text-center">Анализ чека...</h2>
          <p className="text-zinc-500 font-medium text-center max-w-[250px]">Gemini читает позиции из r_keeper и считает вашу зарплату</p>
        </div>
      )}
    </div>
  );
}
