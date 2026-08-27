'use server';

import { adminDb } from '@/lib/firebase/admin';
import crypto from 'crypto';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const SECRET_KEY = new TextEncoder().encode(
  process.env.TELEGRAM_BOT_TOKEN || 'default-secret-key-for-dev'
);

// Функция для верификации initData от Telegram
export async function verifyTelegramInitData(initData: string): Promise<any | null> {
  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    
    if (!hash) return null;
    
    // Убираем hash из списка параметров
    urlParams.delete('hash');
    
    // Сортируем параметры по алфавиту и собираем в строку
    const params = Array.from(urlParams.entries());
    params.sort(([a], [b]) => a.localeCompare(b));
    const dataCheckString = params.map(([key, value]) => `${key}=${value}`).join('\n');
    
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      console.error('TELEGRAM_BOT_TOKEN is not set');
      return null;
    }

    // Создаем секретный ключ из токена бота
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
    
    // Проверяем подпись
    const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
    
    if (calculatedHash !== hash) {
      return null;
    }
    
    // Достаем пользователя
    const userStr = urlParams.get('user');
    if (!userStr) return null;
    
    return JSON.parse(userStr);
  } catch (e) {
    console.error('Error verifying initData:', e);
    return null;
  }
}

// 1. Авторизация через реальный Telegram (продакшен)
export async function loginWithTelegramInitData(initData: string) {
  const tgUser = await verifyTelegramInitData(initData);
  
  if (!tgUser || !tgUser.id) {
    return { error: 'Недействительные данные авторизации Telegram' };
  }
  
  return await authenticateUser(tgUser.id.toString());
}

// 2. Fallback для разработки в браузере (без Telegram)
export async function loginWithTelegramIdDev(telegramId: string) {
  if (process.env.NODE_ENV === 'production') {
    return { error: 'Вход по ID доступен только в режиме разработки' };
  }
  
  return await authenticateUser(telegramId);
}

// Внутренняя функция для поиска сотрудника и установки сессии
async function authenticateUser(telegramId: string) {
  try {
    const snapshot = await adminDb.collection('employees')
      .where('telegram_id', '==', telegramId)
      .where('is_active', '==', true)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return { error: 'Сотрудник с таким Telegram ID не найден или деактивирован' };
    }

    const doc = snapshot.docs[0];
    const employeeData = {
      id: doc.id,
      name: doc.data().name,
      telegram_id: telegramId,
      role: doc.data().role || 'master',
      location_ids: doc.data().location_ids || []
    };

    // Создаем JWT токен сессии
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 дней
    const sessionToken = await new SignJWT(employeeData)
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('30d')
      .sign(SECRET_KEY);

    // Устанавливаем безопасную куку
    (await cookies()).set('crm_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expires,
      path: '/'
    });

    return { success: true, employee: employeeData };
  } catch (error) {
    console.error('Login error:', error);
    return { error: 'Произошла ошибка при авторизации' };
  }
}

// Получить текущего пользователя из сессии
export async function getSession() {
  const sessionCookie = (await cookies()).get('crm_session')?.value;
  if (!sessionCookie) return null;

  try {
    const { payload } = await jwtVerify(sessionCookie, SECRET_KEY);
    return payload as { id: string, name: string, telegram_id: string, role: string, location_ids: string[] };
  } catch (e) {
    return null;
  }
}

export async function logout() {
  (await cookies()).delete('crm_session');
  return { success: true };
}
