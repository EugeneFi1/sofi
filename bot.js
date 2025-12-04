require('dotenv').config();
const {Telegraf} = require('telegraf');
const cron = require('node-cron');

const bot = new Telegraf(process.env.BOT_TOKEN);

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
async function sendWeeklyPoll(chatId) {
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
        console.log('Опитування відправлено');
    } catch (err) {
        console.error('Помилка надсилання опитування:', err);
    }
}

// Команда ручного запуску
bot.command('sendpoll', async (ctx) => {
    const chatId = ctx.update.message.chat.id;
    await sendWeeklyPoll(chatId);
});

bot.command('weekly', async (ctx) => {
    const chatId = ctx.update.message.chat.id;

    ctx.reply('Опитування буде відправлятись щотижня в Четвер 11:00.');

    // Щотижневий cron
    cron.schedule(
        CRON_SCHEDULE,
        async () => {
            console.log('CRON: відправка опитування');
            await sendWeeklyPoll(chatId);
        },
        {scheduled: true, timezone: TIMEZONE}
    );
});

// Запуск бота
bot.launch(() => {
    console.log('Бот запущено');

    // Щотижневий cron
    // cron.schedule(
    //     CRON_SCHEDULE,
    //     () => {
    //         console.log('CRON: відправка опитування');
    sendWeeklyPoll();
    //     },
    //     { scheduled: true, timezone: TIMEZONE }
    // );
})

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
