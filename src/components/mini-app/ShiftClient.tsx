'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Users, User, Moon, CheckCircle2, ArrowLeft } from 'lucide-react';
import { openShift, closeShiftWithImage } from '@/app/actions/shifts';
import { setLocationCookie } from '@/app/actions/locations';

export default function ShiftClient({ 
  locationId, 
  locationName, 
  employeeName, 
  initialShiftStatus, 
  initialShiftId,
  initialPartnerId,
  availablePartners
}: {
  locationId: string;
  locationName: string;
  employeeName: string;
  initialShiftStatus: 'CLOSED' | 'OPEN' | 'PROCESSING';
  initialShiftId: string | null;
  initialPartnerId?: string | null;
  availablePartners: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [shiftStatus, setShiftStatus] = useState<'CLOSED' | 'OPEN' | 'PROCESSING'>(initialShiftStatus);
  const [currentShiftId, setCurrentShiftId] = useState<string | null>(initialShiftId);
  const [error, setError] = useState('');
  
  const [isDuoModalOpen, setIsDuoModalOpen] = useState(false);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('');
  const [currentPartnerId, setCurrentPartnerId] = useState<string | null>(initialPartnerId || null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Обработчик start_param на клиенте
  useEffect(() => {
    // @ts-ignore
    const tg = window?.Telegram?.WebApp;
    const startParam = tg?.initDataUnsafe?.start_param;
    const consumedStartParam = localStorage.getItem('consumed_start_param');

    if (startParam && startParam !== consumedStartParam) {
      router.push('/mini-app/login');
    }
  }, [router]);

  const handleOpenShift = async (type: 'solo' | 'duo') => {
    if (type === 'duo' && !selectedPartnerId) {
      setError('Выберите напарника');
      return;
    }
    
    setShiftStatus('PROCESSING'); // Временно показываем лоадер
    const result = await openShift(locationId, type, type === 'duo' ? selectedPartnerId : undefined);
    
    if (result.error) {
      setError(result.error);
      setShiftStatus('CLOSED');
    } else if (result.success && result.shiftId) {
      if (type === 'duo') {
        setCurrentPartnerId(selectedPartnerId);
      } else {
        setCurrentPartnerId(null);
      }
      setCurrentShiftId(result.shiftId);
      setShiftStatus('OPEN');
      setIsDuoModalOpen(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentShiftId) return;

    setShiftStatus('PROCESSING');
    setError('');

    // Сжимаем картинку перед отправкой (MAX_WIDTH/MAX_HEIGHT уменьшены до 800 для скорости)
    const compressImage = (file: File): Promise<Blob> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 800;
            const MAX_HEIGHT = 800;
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
                if (blob) resolve(blob);
                else reject(new Error('Canvas to Blob failed'));
              },
              'image/jpeg',
              0.6 // quality снижено для скорости
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
        setCurrentPartnerId(null);
        alert(`Смена закрыта! Распознано продаж: ${result.sales}. Заработано: ${result.salary} ₸`);
      }
    } catch (err) {
      console.error(err);
      setError('Ошибка при обработке картинки.');
      setShiftStatus('OPEN');
    }
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex justify-between items-center mb-10">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent tracking-tight">
              {locationName || locationId}
            </h1>
            <button 
              onClick={async () => {
                await setLocationCookie('', '');
              }}
              className="p-2 bg-zinc-900 border border-zinc-800 rounded-full hover:bg-zinc-800 transition-colors"
              title="Сменить точку"
            >
              <ArrowLeft size={16} className="text-zinc-400" />
            </button>
          </div>
          <p className="text-zinc-400 text-sm mt-1 font-medium">Сегодня, {new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}</p>
        </div>
        <div className="w-12 h-12 bg-zinc-800/80 backdrop-blur-md rounded-2xl flex items-center justify-center border border-zinc-700/50 shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-transparent"></div>
          <User className="text-indigo-400 relative z-10" size={24} />
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl flex items-start gap-3 mb-6">
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
            <button onClick={() => setIsDuoModalOpen(true)} className="flex-1 bg-zinc-900/50 backdrop-blur-md border border-zinc-800/80 p-5 rounded-3xl flex flex-col items-center hover:bg-zinc-800 transition-all active:scale-95 group shadow-lg">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Users className="text-indigo-400" size={24} />
              </div>
              <span className="font-semibold text-zinc-300 group-hover:text-white transition-colors">Вдвоем</span>
            </button>
          </div>
        </div>
      )}

      {isDuoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">Выберите напарника</h3>
            <select
              value={selectedPartnerId}
              onChange={(e) => setSelectedPartnerId(e.target.value)}
              className="w-full bg-black/20 border border-zinc-700 rounded-2xl p-4 text-white focus:outline-none focus:border-indigo-500 mb-6"
            >
              <option value="" disabled>-- Выберите сотрудника --</option>
              {availablePartners.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <div className="flex gap-3">
              <button onClick={() => setIsDuoModalOpen(false)} className="flex-1 py-3 bg-zinc-800 rounded-xl font-medium text-white hover:bg-zinc-700">Отмена</button>
              <button onClick={() => handleOpenShift('duo')} className="flex-1 py-3 bg-indigo-600 rounded-xl font-medium text-white hover:bg-indigo-500">Начать смену</button>
            </div>
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
                  <p className="font-bold text-white">{employeeName}</p>
                </div>
                {currentPartnerId && (
                  <>
                    <div className="w-[1px] h-8 bg-white/20"></div>
                    <div className="text-right">
                      <p className="text-indigo-200 text-xs font-medium uppercase tracking-wider mb-1">Напарник</p>
                      <p className="font-bold text-white">
                        {availablePartners.find(p => p.id === currentPartnerId)?.name || 'Загрузка...'}
                      </p>
                    </div>
                  </>
                )}
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
            onClick={() => fileInputRef.current?.click()}
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
          <h2 className="text-2xl font-bold tracking-tight text-white mb-2 text-center">Анализ...</h2>
          <p className="text-zinc-500 font-medium text-center max-w-[250px]">Пожалуйста, подождите</p>
        </div>
      )}
    </div>
  );
}
