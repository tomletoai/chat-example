import dotenv from 'dotenv';
dotenv.config();

import { Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
import { validateUrl } from './utils';
import { parseAndStore } from './parser';
import { answerQuery } from './answer';

export const bot = new Telegraf(process.env.BOT_TOKEN, {
  handlerTimeout: 600_000,
});

bot.command('start', (ctx) =>
  ctx.reply(
    'Привет, я Chat GPT бот, отправь ссылку и я буду отвечать на вопросы'
  )
);

bot.on(message('text'), async (ctx) => {
  const msg = ctx.message.text;
  if (validateUrl(msg)) {
    void parseAndStore(msg, () => void ctx.reply('Парсинг завершен!'));
    return ctx.reply('Начался парсинг сайта');
  }

  const result = await answerQuery(msg);

  return ctx.reply(result);
});

bot.launch();

console.log('Launched!');
