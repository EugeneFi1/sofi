require('dotenv').config();
const express = require('express');
const {Telegraf} = require('telegraf');
const cron = require('node-cron');

const WEBHOOK_URL = process.env.WEBHOOK_URL;

const bot = new Telegraf(process.env.BOT_TOKEN);
const app = express();

app.use(express.json());

bot.telegram.setWebhook(`${WEBHOOK_URL}/bot`);

app.use(bot.webhookCallback('/bot'));

if (process.env.DYNO === "web.1") {
    console.log("Cron enabled on web.1 dyno");

    cron.schedule(
        process.env.CRON_SCHEDULE || '0 17 * * 3',
        async () => {
            console.log('CRON: sending polls');

            for (const chatId of isCronSetForChat.keys()) {
                await sendPoll(chatId);
            }
        },
        {
            scheduled: true,
            timezone: process.env.TIMEZONE || 'Europe/Kyiv',
        }
    );
}

const chatIds = process.env.CHAT_IDS.split(',');

const isCronSetForChat = new Map();

chatIds.forEach((chatId) => {
    console.log('Включити щотижневе опитування для чату chatId: ', chatId);

    isCronSetForChat.set(chatId, true)
});

const pollTemplate = {
    question: 'Будеш цієї неділі?',
    options: ['Так', 'Ні'],
    is_anonymous: false,
    allows_multiple_answers: false,
};

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
        console.log('Poll sent to chat:', chatId);
    } catch (err) {
        console.error('Poll error:', err);
    }
}

bot.command('sendpoll', async (ctx) => {
    const chatId = ctx.chat.id;
    await sendPoll(chatId);
});

bot.command('weeklypoll', async (ctx) => {
    const chatId = ctx.chat.id;

    if (isCronSetForChat.get(chatId)) {
        return ctx.reply('Щотижневе опитування вже налаштовано.');
    }

    isCronSetForChat.set(chatId, true);
    ctx.reply('Опитування буде відправлятись щотижня.');
});

bot.command('offweeklypoll', async (ctx) => {
    const chatId = ctx.chat.id;

    isCronSetForChat.delete(chatId);

    ctx.reply('Щотижневе опитування виключено.');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('Server started on port', PORT);
});
