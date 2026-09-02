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
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://crm.example.com';
        await sendMessage(chatId, 'Добро пожаловать в Hookah CRM! Теперь приложение доступно напрямую через браузер по кнопке ниже.', {
          reply_markup: {
            inline_keyboard: [
              [{ text: 'Открыть CRM', url: `${appUrl}/mini-app/login` }]
            ]
          }
        });
      }
    }
    
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Bot webhook error:', error);
    // Always return 200 to Telegram so it doesn't retry infinitely on our errors
    return NextResponse.json({ ok: false });
  }
}
