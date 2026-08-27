import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { authenticateMiniApp } from '@/lib/telegram/middleware';
import { sendPhotoToStorage } from '@/lib/telegram/bot';
import { analyzeReceiptImage } from '@/lib/gemini/analyze';
import { processShiftData, MasterData } from '@/lib/salaries';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: shiftId } = await params;
    const auth = await authenticateMiniApp(req);
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: 401 });

    const shiftRef = adminDb.collection('shifts').doc(shiftId);
    const shiftSnap = await shiftRef.get();
    
    if (!shiftSnap.exists) {
      return NextResponse.json({ error: 'Shift not found' }, { status: 404 });
    }
    
    const shiftData = shiftSnap.data()!;
    if (shiftData.first_master_id !== auth.employeeId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (shiftData.status !== 'OPEN') {
      return NextResponse.json({ error: 'Shift is not open' }, { status: 400 });
    }

    const formData = await req.formData();
    const file = formData.get('photo') as File;
    if (!file) {
      return NextResponse.json({ error: 'No photo provided' }, { status: 400 });
    }

    await shiftRef.update({ status: 'PROCESSING', updated_at: new Date() });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1. Upload to Telegram
    const storageChatId = process.env.TELEGRAM_STORAGE_CHAT_ID!;
    const tgResponse = await sendPhotoToStorage(storageChatId, buffer, file.name);
    
    let telegram_message_id = null;
    let telegram_file_id = null;
    let telegram_file_unique_id = null;

    if (tgResponse.ok) {
      telegram_message_id = tgResponse.result.message_id;
      const photos = tgResponse.result.photo;
      const bestPhoto = photos[photos.length - 1]; // get highest res
      telegram_file_id = bestPhoto.file_id;
      telegram_file_unique_id = bestPhoto.file_unique_id;
    }

    // 2. Gemini Analysis
    const base64Image = buffer.toString('base64');
    let aiResult;
    try {
      aiResult = await analyzeReceiptImage(base64Image, file.type);
    } catch (e) {
      console.error("Gemini error", e);
      await shiftRef.update({ status: 'ERROR', updated_at: new Date() });
      return NextResponse.json({ error: 'Failed to analyze image' }, { status: 500 });
    }

    const hookahs = typeof aiResult.hookahs === 'number' ? aiResult.hookahs : 0;
    const replacements = typeof aiResult.replacements === 'number' ? aiResult.replacements : 0;

    // 3. Process Business Logic
    const firstMasterData = auth.employeeData as MasterData;
    let secondMasterData: MasterData | null = null;
    
    if (shiftData.second_master_id) {
      const secondMasterSnap = await adminDb.collection('employees').doc(shiftData.second_master_id).get();
      if (secondMasterSnap.exists) {
        secondMasterData = { id: secondMasterSnap.id, ...secondMasterSnap.data() } as MasterData;
      }
    }

    const processed = processShiftData(hookahs, replacements, firstMasterData, secondMasterData);

    // 4. Anomaly detection
    const isAnomaly = processed.total_sales > 50;
    const finalStatus = isAnomaly ? 'NEEDS_REVIEW' : 'CLOSED';

    // 5. Save to Firestore
    await shiftRef.update({
      status: finalStatus,
      closed_at: new Date(),
      updated_at: new Date(),
      
      ai_hookahs: hookahs,
      ai_replacements: replacements,
      
      final_hookahs: hookahs,
      final_replacements: replacements,
      
      telegram_chat_id: storageChatId,
      telegram_message_id,
      telegram_file_id,
      telegram_file_unique_id,
      
      ...processed
    });

    return NextResponse.json({ ok: true, status: finalStatus, result: processed });
  } catch (error) {
    console.error('Close shift error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
