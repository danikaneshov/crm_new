import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { sendMessage } from '@/lib/telegram/bot';

export async function POST(req: Request) {
  try {
    const update = await req.json();
    
    if (update.message && update.message.text) {
      const text = update.message.text;
      const chatId = update.message.chat.id;
      const telegramId = update.message.from.id;

      if (text === '/start') {
        const employeesRef = adminDb.collection('employees');
        const snapshot = await employeesRef
          .where('telegram_id', '==', telegramId)
          .where('is_active', '==', true)
          .get();

        if (snapshot.empty) {
          await sendMessage(chatId, 'Доступ к CRM не предоставлен. Обратитесь к администратору.');
        } else {
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://example.com';
          await sendMessage(chatId, 'Добро пожаловать в Hookah CRM!', {
            inline_keyboard: [
              [{ text: 'Открыть CRM', web_app: { url: `${appUrl}/mini-app` } }]
            ]
          });
        }
      }
    }
    
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Bot webhook error:', error);
    // Always return 200 to Telegram so it doesn't retry infinitely on our errors
    return NextResponse.json({ ok: false });
  }
}
