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

async function shouldBringUmbrella(): Promise<string> {
  const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city},jp&appid=${weatherApiKey}&units=metric&lang=ja`;
  const res = await axios.get(url);
  console.log(JSON.stringify(res.data, null, 2));
  const list = res.data.list;
  const now = new Date();
  const today = now.toISOString().slice(0,10)

  const todayForcases = list.filter((entry:any)=>{
    return entry.dt_txt.startsWith(today);
  });
  
  const willRain = todayForcases.some((entry:any)=>{
    entry.weather[0].main === "Rain"
  });

  return willRain
    ? "☂️ 今日のどこかで雨の予報があります。傘を持って行こう！"
    : "☀️ 今日の予報では雨はなさそうです。傘はいりません！";
}

async function notifyWeather() {
  try {
    const message = await shouldBringUmbrella();
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
