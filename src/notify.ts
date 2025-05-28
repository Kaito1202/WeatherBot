// src/notify.ts
import { Client } from '@line/bot-sdk';
import cron from 'node-cron';
import { shouldBringUmbrella } from './weather';
import dotenv from 'dotenv';

dotenv.config();

const lineClient = new Client({
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN!,
  channelSecret: process.env.CHANNEL_SECRET!,
});

// 毎朝7:30に通知
cron.schedule('15 21 * * *', async () => {
  await notifyWeather();
}, {
  timezone: 'Asia/Tokyo' // ✅ これがないとUTC時間で動きます（JSTより9時間遅れ）
});

// 開発中すぐにテスト実行
notifyWeather();

async function notifyWeather() {
  try {
    const message = await shouldBringUmbrella();
    await lineClient.broadcast({
      type: 'text',
      text: message,
    });
    console.log(`[通知成功] ${new Date().toLocaleString()} に送信`);
  } catch (err) {
    console.error(`[通知失敗] ${new Date().toLocaleString()} -`, err);
  }
}
