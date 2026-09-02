'use server';

import { adminDb } from '@/lib/firebase/admin';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const SECRET_KEY = new TextEncoder().encode(
  process.env.TELEGRAM_BOT_TOKEN || 'default-secret-key-for-dev'
);

export async function loginWithPin(pin: string) {
  if (!pin || pin.length !== 4) {
    return { error: 'Неверный формат PIN-кода' };
  }

  try {
    const snapshot = await adminDb.collection('employees')
      .where('pin', '==', pin)
      .where('is_active', '==', true)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return { error: 'Неверный PIN-код или аккаунт деактивирован' };
    }

    const doc = snapshot.docs[0];
    const employeeData = {
      id: doc.id,
      name: doc.data().name,
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
    return payload as { id: string, name: string, role: string, location_ids: string[] };
  } catch (e) {
    return null;
  }
}

export async function logout() {
  (await cookies()).delete('crm_session');
  return { success: true };
}
