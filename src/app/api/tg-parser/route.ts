import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Инициализация Supabase с сервисным ключом для обхода RLS при записи
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  // Роут для быстрой установки вебхука Telegram
  if (searchParams.get('setup') === 'true') {
    if (!TELEGRAM_BOT_TOKEN) {
      return NextResponse.json({ error: 'Отсутствует переменная TELEGRAM_BOT_TOKEN' }, { status: 400 });
    }
    
    const host = request.headers.get('host');
    const protocol = host?.includes('localhost') ? 'http' : 'https';
    const webhookUrl = `${protocol}://${host}/api/tg-parser`;
    
    const tgRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook?url=${webhookUrl}`);
    const data = await tgRes.json();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Вебхук успешно установлен!', 
      webhookUrl, 
      telegramResponse: data 
    });
  }
  
  return NextResponse.json({ status: 'PARSER API is active. Use ?setup=true to register webhook.' });
}

export async function POST(request: Request) {
  try {
    const update = await request.json();
    
    // 1. Обработка ОБЫЧНЫХ сообщений (новых машин)
    const msg = update.channel_post || update.message;
    if (!msg) {
      return NextResponse.json({ status: 'ignored', reason: 'Not a message or post' });
    }

    const text = msg.caption || msg.text || '';
    const telegramId = msg.message_id || msg.channel_post?.message_id;

    // Проверяем, не является ли это обновлением статуса через Reply
    if (msg.reply_to_message) {
      const replyToMsg = msg.reply_to_message;
      const targetTelegramId = replyToMsg.message_id;
      const replyText = text.toLowerCase();

      let newStatus = '';
      if (replyText.includes('продан')) newStatus = 'sold';
      else if (replyText.includes('бронь') || replyText.includes('заброниров')) newStatus = 'reserved';
      else if (replyText.includes('под заказ')) newStatus = 'on_order';
      else if (replyText.includes('в наличии')) newStatus = 'available';

      if (newStatus) {
        const { error: updateError } = await supabase
          .from('cars')
          .update({ status: newStatus })
          .eq('telegram_id', targetTelegramId);

        if (updateError) {
          console.error('Ошибка обновления статуса:', updateError);
          return NextResponse.json({ error: 'Status update failed' }, { status: 500 });
        }
        return NextResponse.json({ success: true, message: `Status updated to ${newStatus}` });
      }
    }

    // Если это не статус и нет ключевых слов — игнорируем
    if (!text.includes('Год выпуска:')) {
      return NextResponse.json({ status: 'ignored', reason: 'Does not match template' });
    }

    // --- ПАРСИНГ ---
    const lines = text.split('\n').map((l: any) => l.trim()).filter(Boolean);
    const titleLine = lines[0] || 'Unknown Car';
    const brand = titleLine.split(' ')[0] || 'Unknown';
    const model = titleLine.split(' ').slice(1).join(' ') || '';

    const yearMatch = text.match(/Год выпуска:\s*(\d+)/i);
    const mileageMatch = text.match(/Пробег:\s*([\d\s.]+)\s*км/i);
    const fuelMatch = text.match(/Топливо:\s*(.+)/i);
    const transmissionMatch = text.match(/КПП:\s*(.+)/i);
    const driveMatch = text.match(/Привод:\s*(.+)/i);
    const priceMatch = text.match(/ЦЕНА ПОД КЛЮЧ:\s*([\d\s.]+)\s*(?:₽|руб)/i) || text.match(/ЦЕНА ПОД КЛЮЧ:\s*([\d\s.]+)/i);
    const colorMatch = text.match(/Цвет:\s*(.+)/i);
    const engineMatch = text.match(/Двигатель:\s*(.+)/i);

    const year = yearMatch ? parseInt(yearMatch[1], 10) : 2020;
    const mileage = mileageMatch ? parseInt(mileageMatch[1].replace(/[\s.]/g, ''), 10) : 0;
    const price = priceMatch ? parseInt(priceMatch[1].replace(/[\s.]/g, ''), 10) : 0;
    const fuel_type = fuelMatch ? fuelMatch[1].trim() : 'Бензин';
    
    let transmission = 'автомат';
    const transText = transmissionMatch ? transmissionMatch[1].toLowerCase() : '';
    if (transText.includes('механ')) transmission = 'механика';
    else if (transText.includes('робот')) transmission = 'робот';
    else if (transText.includes('вариат')) transmission = 'вариатор';

    let body_type = 'fwd';
    const driveText = driveMatch ? driveMatch[1].toLowerCase() : '';
    if (driveText.includes('задн')) body_type = 'rwd';
    else if (driveText.includes('полн')) body_type = 'awd';

    // --- ФОТО ---
    let finalImageUrl = '';
    if (msg.photo && msg.photo.length > 0) {
      const bestPhoto = msg.photo[msg.photo.length - 1];
      const fileId = bestPhoto.file_id;
      
      const fileRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`);
      const fileData = await fileRes.json();
      
      if (fileData.ok && fileData.result.file_path) {
        const fileUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${fileData.result.file_path}`;
        const imageRes = await fetch(fileUrl);
        const buffer = Buffer.from(await imageRes.arrayBuffer());
        
        const fileName = `tg_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
        const { data: uploadData } = await supabase.storage.from('ZVUK-CARS').upload(fileName, buffer, { contentType: 'image/jpeg' });
        
        if (uploadData) {
          const { data: publicUrlData } = supabase.storage.from('ZVUK-CARS').getPublicUrl(fileName);
          finalImageUrl = publicUrlData.publicUrl;
        }
      }
    }

    const slug = `${brand}-${model}-${year}-${telegramId || Date.now()}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    // --- СОХРАНЕНИЕ (UPSERT) ---
    const { data: upsertData, error: upsertError } = await supabase
      .from('cars')
      .upsert({
        telegram_id: telegramId,
        brand,
        model,
        year,
        mileage,
        price,
        fuel_type,
        transmission,
        body_type, // поле привода
        main_image: finalImageUrl || null,
        images: finalImageUrl ? [finalImageUrl] : [],
        full_description: text,
        short_description: `${year} год, ${mileage.toLocaleString()} км, ${fuel_type}`,
        status: 'available',
        slug,
        location_country: 'Россия',
        location_city: 'Москва'
      }, { onConflict: 'telegram_id' });

    if (upsertError) {
      console.error('Ошибка сохранения в базу:', upsertError);
      return NextResponse.json({ error: 'DB Upsert failed' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Car processed successfully' });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
