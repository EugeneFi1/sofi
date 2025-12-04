// const express = require('express');
require('dotenv').config();
const {Telegraf} = require('telegraf');
const cron = require('node-cron');

const bot = new Telegraf(process.env.BOT_TOKEN);
// const app = express();

// app.use(express.json());
// app.use(bot.webhookCallback('/bot'));

// bot.telegram.setWebhook(process.env.WEBHOOK_URL + '/bot');

// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//     console.log('Server started on port', PORT);
// });

// const app = express();
// const bot = new Telegraf(process.env.BOT_TOKEN);
const isCronSetForChat = new Map();

// app.use(bot.webhookCallback('/bot'));

const CRON_SCHEDULE = process.env.CRON_SCHEDULE || '0 17 * * 3'; // default Monday 09:00
const TIMEZONE = process.env.TIMEZONE || 'Europe/Kyiv';

// Опитування яке буде створюватися щотижня
const pollTemplate = {
    question: 'Будеш цієї неділі?',
    options: ['Так', 'Ні'],
    is_anonymous: false,
    allows_multiple_answers: false,
};

// Функція відправки опитування
async function sendPoll(chatId) {
    try {
        await bot.telegram.sendPoll(
            chatId,
            pollTemplate.question,
            pollTemplate.options,
            {
                is_anonymous: pollTemplate.is_anonymous,
                allows_multiple_answers: pollTemplate.allows_multiple_answers,
            }
        );
        console.log('Опитування відправлено, chatId: ', chatId);
    } catch (err) {
        console.error('Помилка надсилання опитування:', err);
    }
}

// Команда ручного запуску
bot.command('sendpoll', async (ctx) => {
    const chatId = ctx.update.message.chat.id;
    await sendPoll(chatId);
});

bot.command('weeklypoll', async (ctx) => {
    const chatId = ctx.update.message.chat.id;

    if (isCronSetForChat.get(chatId)) {
        ctx.reply('Щотижневе опитування налаштовано.');
        return;
    }

    isCronSetForChat.set(chatId, true);

    ctx.reply('Опитування буде відправлятись щотижня.');

    // Щотижневий cron
    cron.schedule(
        CRON_SCHEDULE,
        async () => {
            console.log('CRON: відправка опитування');
            await sendPoll(chatId);
        },
        {scheduled: true, timezone: TIMEZONE}
    );
});

// Запуск бота
bot.launch(() => {
    console.log('Бот запущено');
})

// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Установити webhook
// bot.telegram.setWebhook(`https://sofi-py9t.onrender.com/bot`);

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
