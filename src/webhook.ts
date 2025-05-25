import express from 'express';
import { middleware, Client } from '@line/bot-sdk';
import dotenv from 'dotenv';
import { shouldBringUmbrella } from './weather'; // ← 既存の関数を使う

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN!,
  channelSecret: process.env.CHANNEL_SECRET!,
};

const client = new Client(config);

app.post('/webhook', middleware(config), async (req, res) => {
  const events = req.body.events;

  for (const event of events) {
    if (event.type === 'message' && event.message.type === 'text') {
      const text = event.message.text.trim();

      // 「傘いる？」と聞かれたら
      if (text.includes("傘")) {
        const replyToken = event.replyToken;
        try {
          const message = await shouldBringUmbrella();
          await client.replyMessage(replyToken, {
            type: 'text',
            text: message,
          });
        } catch (err) {
          await client.replyMessage(replyToken, {
            type: 'text',
            text: "エラーが発生しました。しばらくしてもう一度お試しください。",
          });
        }
      }
    }
  }

  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log(`🚀 Webhookサーバ起動: http://localhost:${PORT}`);
});
