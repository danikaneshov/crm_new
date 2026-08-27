import { validateInitData, parseInitData } from './auth';
import { adminDb } from '../firebase/admin';

export async function authenticateMiniApp(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('tma ')) {
    return { error: 'Missing or invalid Authorization header' };
  }

  const initData = authHeader.substring(4);
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  
  if (!botToken) {
    return { error: 'Server configuration error' };
  }

  // NOTE: For local dev without a real Telegram context, you might want to bypass this
  // or use a mock initData. For production, strictly validate:
  if (process.env.NODE_ENV === 'production' && !validateInitData(initData, botToken)) {
    return { error: 'Invalid initData signature' };
  }

  const userData = parseInitData(initData);
  if (!userData || !userData.id) {
    return { error: 'User data not found in initData' };
  }

  const telegramId = userData.id;

  const employeesRef = adminDb.collection('employees');
  const snapshot = await employeesRef
    .where('telegram_id', '==', telegramId)
    .where('is_active', '==', true)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return { error: 'Employee not found or inactive' };
  }

  const employeeDoc = snapshot.docs[0];
  const employeeData = employeeDoc.data();

  return { 
    employeeId: employeeDoc.id, 
    employeeData: { ...employeeData, id: employeeDoc.id } 
  };
}
