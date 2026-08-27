'use server';

import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebase/admin';

export async function loginAdminWithToken(idToken: string) {
  try {
    // 1. Проверяем токен через Firebase Admin
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    
    // 2. Создаем сессионную куку Firebase (на 5 дней)
    const expiresIn = 60 * 60 * 24 * 5 * 1000;
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    // 3. Сохраняем куку в браузере
    (await cookies()).set('admin_session', sessionCookie, {
      maxAge: expiresIn / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
    });

    return { success: true };
  } catch (error) {
    console.error('Error verifying admin token:', error);
    return { error: 'Недействительный токен авторизации' };
  }
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  
  // 1. Проверяем обычную сессию админа (по email/password)
  const sessionCookie = cookieStore.get('admin_session')?.value;
  if (sessionCookie) {
    try {
      const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
      return decodedClaims;
    } catch (error) {
      // Игнорируем ошибку и идем дальше
    }
  }

  // 2. Проверяем сессию владельца из Telegram
  const crmSession = cookieStore.get('crm_session')?.value;
  if (crmSession) {
    try {
      // Динамический импорт, чтобы избежать кольцевых зависимостей
      const { getSession } = await import('@/app/actions/auth');
      const crmPayload = await getSession();
      if (crmPayload && crmPayload.role === 'owner') {
        return crmPayload; // Разрешаем доступ владельцу
      }
    } catch (e) {
      return null;
    }
  }

  return null;
}

export async function logoutAdmin() {
  const cookieStore = await cookies();
  cookieStore.delete('admin_session');
  cookieStore.delete('crm_session');
  return { success: true };
}
