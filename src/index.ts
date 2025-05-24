import dotenv from 'dotenv';
import axios from 'axios';
import { Client } from '@line/bot-sdk';
import cron from 'node-cron';
import { DateTime } from 'luxon'; 

dotenv.config();

const lineClient = new Client({
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN!,
  channelSecret: process.env.CHANNEL_SECRET!,
});

const userId = process.env.USER_ID!;
const city = process.env.CITY!;
const weatherApiKey = process.env.OPENWEATHER_API_KEY!;
//const weatherJPMap: Record<string, string> = {
//  "Rain": "雨",
//  "Drizzle": "霧雨",
//  "Thunderstorm": "雷雨"
//};

async function shouldBringUmbrella(): Promise<string> {
  const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city},jp&appid=${weatherApiKey}&units=metric&lang=ja`;
  const res = await axios.get(url);
  const list = res.data.list;

  // 現在時刻を JST に
  const nowJST = DateTime.now().setZone('Asia/Tokyo');
  console.log(nowJST);
  const today = nowJST.toISODate(); // 例: "2025-05-24"
  console.log(today);

  const rainHours: string[] = [];

  for (const entry of list) {
    // entry.dt_txt は UTC なので、JST に変換する
    const entryTimeJST = DateTime.fromFormat(entry.dt_txt, "yyyy-MM-dd HH:mm:ss", { zone: 'utc' }).setZone('Asia/Tokyo');
    const entryDate = entryTimeJST.toISODate(); // JSTベースの日付
    if (entryDate !== today) continue;

    const main = entry.weather[0].main;
    if (["Rain", "Drizzle", "Thunderstorm"].includes(main)) {
      const hour = entryTimeJST.hour;
      //const jpMain = weatherJPMap[main] || main;
      //rainHours.push(`${hour}時（${jpMain}）`);
      rainHours.push(`${hour}時`);
    }
  }

  if (rainHours.length === 0) {
    return "☀️ 今日の予報では雨はなさそうです。傘はいりません！";
  }

  return `☂️ 今日の降水予報があります。\n${rainHours.join("、")} 時点で雨が降っている可能性があります。(3時間ごとに計測しています。）\n傘を持って行きましょう！`;
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
