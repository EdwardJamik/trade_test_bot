const TelegramBot = require('node-telegram-bot-api');
const fs = require("fs");
const path = require("path");

// Конфігурація для локального API сервера
const bot = new TelegramBot(process.env.TG_TOKEN, {polling: true });

// Приклад обробки файлів
bot.on('document', async (msg) => {
    try {
        const file = await bot.getFile(msg.document.file_id);
        console.log('Локальний шлях до файлу:', file.file_path);

        // Приклад відправки великого файлу
        await bot.sendDocument(msg.chat.id, '/path/to/large/file.zip', {
            caption: 'Великий файл'
        });

    } catch (error) {
        console.error('Помилка при обробці файлу:', error);
        bot.sendMessage(msg.chat.id, 'Виникла помилка при обробці файлу');
    }
});

// Базовий обробник повідомлень
bot.on('message', (msg) => {
    const chatId = msg.chat.id;

    if (msg.text === '/start') {
        bot.sendMessage(chatId, 'Привіт! Бот запущений з локальним API сервером');
    }
});

// Обробка помилок
bot.on('polling_error', (error) => {
    console.error('Помилка polling:', error);
});

bot.on('webhook_error', (error) => {
    console.error('Помилка webhook:', error);
});

console.log('Бот запущений');

async function sendLargeVideo(chatId, videoPath, caption = '') {
    try {
        // Перевіряємо чи існує файл
        if (!fs.existsSync(videoPath)) {
            throw new Error('Відео файл не знайдено');
        }

        // Отримуємо розмір файлу
        const stats = fs.statSync(videoPath);
        const fileSizeInMB = stats.size / (1024 * 1024);
        console.log(`Розмір відео: ${fileSizeInMB.toFixed(2)} MB`);

        // Відправляємо відео
        console.log('Початок відправки відео...');
        await bot.sendVideo(chatId, videoPath, {
            caption: caption,
            // Додаткові параметри для відео
            thumb: null, // Можна додати прев'ю
            duration: null, // Можна вказати тривалість
            width: null, // Можна вказати ширину
            height: null, // Можна вказати висоту
            supports_streaming: true
        }, {
            // Налаштування для великих файлів
            filename: path.basename(videoPath),
            contentType: 'video/mp4'
        });

        console.log('Відео успішно відправлено');
    } catch (error) {
        console.error('Помилка при відправці відео:', error);
        throw error;
    }
}

// Обробник команди для відправки відео
bot.onText(/\/sendvideo/, async (msg) => {
    const chatId = msg.chat.id;

    try {
        await bot.sendMessage(chatId, 'Починаю відправку великого відео...');

        // Шлях до вашого відео файлу
        const videoPath = './uploads/module/34c1d528-67ef-44ed-b16e-d052dd3c2d1d.mp4';

        await sendLargeVideo(chatId, videoPath, 'Ось ваше відео');

    } catch (error) {
        bot.sendMessage(chatId, 'Помилка при відправці відео: ' + error.message);
    }
});

// Обробник для отримання відео від користувача
bot.on('video', async (msg) => {
    try {
        const file = await bot.getFile(msg.video.file_id);
        console.log('Отримано відео. Локальний шлях:', file.file_path);

        // Тут можна обробити отримане відео
        await bot.sendMessage(msg.chat.id, `Отримано відео розміром ${msg.video.file_size} байт`);
    } catch (error) {
        console.error('Помилка при обробці отриманого відео:', error);
    }
});