const TelegramBot = require('node-telegram-bot-api');
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
require('dotenv').config();

// Конфигурация
const token = '8986419272:AAHZwwzok300Nyb3wXwnJUF1MKNDXoB5MrM';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Ошибка: Не найдены ключи Supabase в .env файле!');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const bot = new TelegramBot(token, { polling: true });

console.log('🤖 Бот-парсер запущен и готов принимать посты...');
console.log('Подключено к Supabase:', supabaseUrl);

async function uploadImage(fileId, carSlug) {
    try {
        const fileLink = await bot.getFileLink(fileId);
        const response = await axios.get(fileLink, { responseType: 'arraybuffer' });
        const fileName = `tg_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
        
        const { data, error } = await supabase.storage
            .from('ZVUK-CARS')
            .upload(fileName, response.data, { 
                contentType: 'image/jpeg'
            });

        if (error) throw error;
        const { data: publicUrl } = supabase.storage.from('ZVUK-CARS').getPublicUrl(fileName);
        return publicUrl.publicUrl;
    } catch (e) {
        console.error('❌ Ошибка загрузки фото:', e.message);
        return null;
    }
}

function parseCar(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    
    // Пытаемся найти заголовок (обычно первая строка или строка с рамками)
    let title = lines[0] || 'Unknown Car';
    if (title.includes('═══')) {
        const match = title.match(/═══ (.*?) ═══/);
        if (match) title = match[1];
    }
    
    const brand = title.split(' ')[0] || 'Unknown';
    const model = title.split(' ').slice(1).join(' ') || '';

    const yearMatch = text.match(/Год выпуска:\s*(\d+)/i);
    const mileageMatch = text.match(/Пробег:\s*([\d\s.]+)\s*км/i);
    const fuelMatch = text.match(/Топливо:\s*(.+)/i);
    const transmissionMatch = text.match(/КПП:\s*(.+)/i) || text.match(/Коробка:\s*(.+)/i);
    const driveMatch = text.match(/Привод:\s*(.+)/i);
    const priceMatch = text.match(/ЦЕНА ПОД КЛЮЧ:\s*([\d\s.]+)\s*(?:₽|руб)/i) || text.match(/Общая стоимость под ключ\s*[-—–]\s*([\d\s.]+)/i);
    const engineMatch = text.match(/Двигатель:\s*(.+)/i);
    const colorMatch = text.match(/Цвет:\s*(.+)/i);

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

    const slug = `${brand}-${model}-${year}-${Date.now()}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    return {
        brand,
        model,
        year,
        mileage,
        price,
        fuel_type,
        transmission,
        body_type,
        slug,
        full_description: text,
        short_description: `${year} год, ${mileage.toLocaleString()} км, ${fuel_type}`,
        status: 'available'
    };
}

bot.on('message', async (msg) => {
    const text = msg.text || msg.caption;
    if (!text) return;

    // 1. Статусы через Reply
    if (msg.reply_to_message) {
        const lowerText = text.toLowerCase();
        let newStatus = null;
        
        if (lowerText.includes('продан')) newStatus = 'sold';
        else if (lowerText.includes('бронь')) newStatus = 'reserved';
        else if (lowerText.includes('под заказ')) newStatus = 'on_order';
        else if (lowerText.includes('в наличии')) newStatus = 'available';

        if (newStatus) {
            const originalId = msg.reply_to_message.message_id;
            const { error } = await supabase
                .from('cars')
                .update({ status: newStatus })
                .eq('telegram_id', String(originalId));
            
            if (!error) {
                bot.sendMessage(msg.chat.id, `✅ Статус обновлен на: ${newStatus.toUpperCase()}`);
            } else {
                bot.sendMessage(msg.chat.id, '❌ Не нашел машину в базе.');
            }
            return;
        }
    }

    // 2. Новая машина
    if (text.includes('Год выпуска:')) {
        const carData = parseCar(text);
        bot.sendMessage(msg.chat.id, `⌛ Вижу ${carData.brand} ${carData.model}. Обрабатываю...`);
        
        let imageUrl = null;
        if (msg.photo) {
            imageUrl = await uploadImage(msg.photo[msg.photo.length - 1].file_id, carData.slug);
        }

        const telegramId = String(msg.message_id);
        const { error } = await supabase.from('cars').upsert([{
            ...carData,
            main_image: imageUrl,
            images: imageUrl ? [imageUrl] : [],
            telegram_id: telegramId
        }], { 
            onConflict: 'telegram_id' 
        });

        if (error) {
            bot.sendMessage(msg.chat.id, '❌ Ошибка при сохранении в базу: ' + error.message);
        } else {
            bot.sendMessage(msg.chat.id, `🚀 Успех! Данные по машине "${carData.title}" синхронизированы с сайтом.`);
        }
    }
});
