const TELEGRAM_API_URL = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

export async function sendMessage(chatId: number, text: string, replyMarkup?: any) {
  const response = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      reply_markup: replyMarkup,
    }),
  });
  return response.json();
}

export async function sendPhotoToStorage(chatId: string | number, imageBuffer: Buffer, filename: string = 'report.jpg') {
  const formData = new FormData();
  formData.append('chat_id', chatId.toString());
  
  const blob = new Blob([new Uint8Array(imageBuffer)], { type: 'image/jpeg' });
  formData.append('photo', blob, filename);

  const response = await fetch(`${TELEGRAM_API_URL}/sendPhoto`, {
    method: 'POST',
    body: formData,
  });
  
  return response.json();
}
