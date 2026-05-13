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
        const fileName = `${carSlug}-${Date.now()}.jpg`;
        
        const { data, error } = await supabase.storage
            .from('cars')
            .upload(fileName, response.data, { 
                contentType: 'image/jpeg',
                upsert: true 
            });

        if (error) throw error;
        const { data: publicUrl } = supabase.storage.from('cars').getPublicUrl(fileName);
        return publicUrl.publicUrl;
    } catch (e) {
        console.error('❌ Ошибка загрузки фото:', e.message);
        return null;
    }
}

function parseCar(text) {
    const titleMatch = text.match(/╔═══ (.*?) ═══╗/);
    if (!titleMatch) return null;

    const brandModel = titleMatch[1].split(' ');
    const brand = brandModel[0];
    const model = brandModel.slice(1).join(' ');
    
    const year = text.match(/Год выпуска: (\d{4})/)?.[1];
    const mileage = text.match(/Пробег: ([\d\s]+) км/)?.[1]?.replace(/\s/g, '');
    
    // Улучшенный поиск цены: понимает любое тире и убирает точки/пробелы
    const priceMatch = text.match(/Общая стоимость под ключ\s*[-—–]\s*([\d\s.,]+)\s*руб/i);
    const priceValue = priceMatch ? priceMatch[1].replace(/[^\d]/g, '') : '0';

    const fuel = text.match(/Топливо: (.*)/)?.[1];
    const transmission = text.match(/Коробка: (.*)/)?.[1];
    
    const slug = `${brand}-${model}-${year}-${Math.random().toString(36).substr(2, 5)}`.toLowerCase().replace(/[^a-z0-9]/g, '-');

    return {
        brand,
        model,
        year: parseInt(year) || 2020,
        mileage: parseInt(mileage) || 0,
        price: parseInt(priceValue) || 0,
        fuel_type: fuel?.trim() || 'Дизель',
        transmission: transmission?.trim() || 'Автомат',
        title: titleMatch[1],
        slug,
        full_description: text,
        status: 'available'
    };
}

bot.on('message', async (msg) => {
    const text = msg.text || msg.caption;
    if (!text) return;

    // 1. Обработка "ПРОДАНО" (если это ответ на сообщение)
    if (msg.reply_to_message) {
        const lowerText = text.toLowerCase();
        let newStatus = null;
        
        if (lowerText.includes('продано')) newStatus = 'sold';
        if (lowerText.includes('бронь') || lowerText.includes('заброниров')) newStatus = 'reserved';
        if (lowerText.includes('под заказ')) newStatus = 'on_order';
        if (lowerText.includes('в наличии') || lowerText.includes('активн')) newStatus = 'available';

        if (newStatus) {
            const originalId = msg.reply_to_message.forward_from_message_id || msg.reply_to_message.message_id;
            const { error } = await supabase
                .from('cars')
                .update({ status: newStatus })
                .eq('telegram_id', String(originalId));
            
            if (!error) {
                bot.sendMessage(msg.chat.id, `✅ Статус машины обновлен на: ${newStatus.toUpperCase()}`);
            } else {
                bot.sendMessage(msg.chat.id, '❌ Не удалось найти машину в базе для обновления статуса.');
            }
            return;
        }
    }

    // 2. Парсинг Машины
    const carData = parseCar(text);
    if (carData) {
        bot.sendMessage(msg.chat.id, '⌛ Вижу машину: ' + carData.title + '. Начинаю добавление...');
        
        let imageUrl = null;
        if (msg.photo) {
            imageUrl = await uploadImage(msg.photo[msg.photo.length - 1].file_id, carData.slug);
        }

        const { error } = await supabase.from('cars').upsert([{
            ...carData,
            main_image: imageUrl,
            telegram_id: String(msg.forward_from_message_id || msg.message_id)
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
