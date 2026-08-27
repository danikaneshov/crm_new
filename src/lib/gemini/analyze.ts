import { GoogleGenAI } from '@google/genai';

// Initialize the SDK. It automatically uses process.env.GEMINI_API_KEY
const ai = new GoogleGenAI();

const systemInstruction = `
Ты - специализированный анализатор чеков r_keeper для кальянной CRM.
Твоя задача: найти на фотографии чека итоговое количество "кальянов" и "замен".

Правила соответствия:
- "Дымный коктейль" (или аналогичные названия первого кальяна) = hookahs
- "Дымный коктейль 2", "Замена", "Перезабивка" = replacements

Не обращай внимания на чай, напитки, еду или общую сумму в тенге.
Если позиций нет, верни 0.

Ответ должен быть СТРОГО в формате JSON:
{
  "hookahs": 5,
  "replacements": 2
}
`;

export async function analyzeReceiptImage(base64Image: string, mimeType: string) {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        role: 'user',
        parts: [
          { text: systemInstruction },
          { inlineData: { data: base64Image, mimeType: mimeType } }
        ]
      }
    ],
    config: {
      responseMimeType: 'application/json',
    }
  });
  
  const text = response.text;
  if (!text) throw new Error("Gemini returned empty response");
  
  return JSON.parse(text);
}
