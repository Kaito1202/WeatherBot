// src/weather.ts
import axios from 'axios';
import { DateTime } from 'luxon';
import dotenv from 'dotenv';

dotenv.config();

const city = process.env.CITY!;
const weatherApiKey = process.env.OPENWEATHER_API_KEY!;

export async function shouldBringUmbrella(): Promise<string> {
  const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city},jp&appid=${weatherApiKey}&units=metric&lang=ja`;
  const res = await axios.get(url);
  const list = res.data.list;

  const nowJST = DateTime.now().setZone('Asia/Tokyo');
  const today = nowJST.toISODate();
  const rainHours: string[] = [];

  for (const entry of list) {
    const entryTimeJST = DateTime.fromFormat(entry.dt_txt, "yyyy-MM-dd HH:mm:ss", { zone: 'utc' }).setZone('Asia/Tokyo');
    const entryDate = entryTimeJST.toISODate();
    if (entryDate !== today) continue;

    const main = entry.weather[0].main;
    if (["Rain", "Drizzle", "Thunderstorm"].includes(main)) {
      const hour = entryTimeJST.hour;
      rainHours.push(`${hour}時`);
    }
  }

  if (rainHours.length === 0) {
    return "☀️ 今日の予報では雨はなさそうです。傘はいりません！";
  }

  return `☂️ 今日の降水予報があります。\n${rainHours.join("、")} 時点で雨が降っている可能性があります。(3時間ごとに計測しています。）\n傘を持って行きましょう！`;
}
