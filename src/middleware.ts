import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Защищаем только роуты внутри /mini-app, кроме логина
  if (pathname.startsWith('/mini-app') && !pathname.startsWith('/mini-app/login')) {
    const sessionCookie = request.cookies.get('crm_session');
    
    // Если сессии нет, перенаправляем на страницу логина
    if (!sessionCookie) {
      const loginUrl = new URL('/mini-app/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
    
    // Если сессия есть, но нет сохраненной локации, и пользователь пытается зайти на /mini-app
    if (pathname === '/mini-app') {
      const locationCookie = request.cookies.get('location_id');
      if (!locationCookie) {
        const selectLocationUrl = new URL('/mini-app/select-location', request.url);
        return NextResponse.redirect(selectLocationUrl);
      }
    }
  }

  // Защищаем админку
  if (pathname.startsWith('/admin') && pathname !== '/admin/login' && !pathname.startsWith('/admin/api')) {
    const adminSessionCookie = request.cookies.get('admin_session');
    if (!adminSessionCookie) {
      const adminLoginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(adminLoginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/mini-app/:path*', '/admin/:path*'],
};
