import dotenv from 'dotenv';
import axios from 'axios';
import { Client } from '@line/bot-sdk';
import cron from 'node-cron';

dotenv.config();

const lineClient = new Client({
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN!,
  channelSecret: process.env.CHANNEL_SECRET!,
});

const userId = process.env.USER_ID!;
const city = process.env.CITY!;
const weatherApiKey = process.env.OPENWEATHER_API_KEY!;

async function getWeather(): Promise<string> {
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${weatherApiKey}&units=metric&lang=ja`;
  const res = await axios.get(url);
  const data = res.data;
  return `【${data.name}の天気】\n${data.weather[0].description}\n気温: ${data.main.temp}°C`;
}

async function notifyWeather() {
  try {
    const message = await getWeather();
    await lineClient.pushMessage(userId, {
      type: 'text',
      text: message,
    });
    console.log(`[通知成功] ${new Date().toLocaleString()} に送信`);
  } catch (err) {
    console.error(`[通知失敗] ${new Date().toLocaleString()} -`, err);
  }
}

// ✅ 毎日朝7:30に実行（日本時間ベース）
cron.schedule('30 7 * * *', () => {
  console.log('⏰ 定期通知実行中...');
  notifyWeather();
});

// ✅ デバッグ用にすぐ1回実行（開発中は便利）
notifyWeather();
