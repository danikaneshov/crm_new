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
  const sessionCookie = (await cookies()).get('admin_session')?.value;
  if (!sessionCookie) return null;

  try {
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
    return decodedClaims;
  } catch (error) {
    return null;
  }
}

export async function logoutAdmin() {
  (await cookies()).delete('admin_session');
  return { success: true };
}
