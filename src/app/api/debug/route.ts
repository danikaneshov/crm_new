import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const admin = await import('@/lib/firebase/admin');
    return NextResponse.json({ 
      success: true, 
      hasApp: !!admin.adminDb
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      stack: error.stack,
      privateKeyLength: process.env.FIREBASE_PRIVATE_KEY?.length || 0,
      privateKeyPreview: process.env.FIREBASE_PRIVATE_KEY?.substring(0, 30) + '...'
    });
  }
}
