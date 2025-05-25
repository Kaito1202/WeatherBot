import express from 'express';
import { middleware, Client } from '@line/bot-sdk';
import dotenv from 'dotenv';
import { shouldBringUmbrella } from './weather';
import type { Request, Response } from 'express';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN!,
  channelSecret: process.env.CHANNEL_SECRET!,
};

const client = new Client(config);

// ✅ 簡易確認用ルート
app.get('/', (req, res) => {
  res.send('Webhook server is running.');
});

// ✅ Webhookエンドポイント
app.post('/webhook', middleware(config), async (req: Request, res: Response) => {
  console.log("✅ Webhook受信:", JSON.stringify(req.body, null, 2));

  const events = req.body.events;

  for (const event of events) {
    if (event.type === 'message' && event.message.type === 'text') {
      const text = event.message.text.trim();

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
            text: "エラーが発生しました。",
          });
        }
      }
    }
  }

  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log(`🚀 Webhookサーバ起動: http://localhost:${PORT}/webhook`);
});
