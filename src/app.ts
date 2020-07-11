import {
  // main APIs
  Client,
  middleware,

  // exceptions
  JSONParseError,
  SignatureValidationFailed,

  // types
  TemplateMessage,
  WebhookEvent,
} from "@line/bot-sdk";
import Express from 'express';
import dotenv from "dotenv";

dotenv.config();


let getOrElse = <T>(expr: T | undefined, fallback: T) => (expr ? expr : fallback);
const config = {
  channelAccessToken: getOrElse(process.env.MESSAGE_API_CHANNEL_ACCESS_TOKEN, ''),
  channelSecret: getOrElse(process.env.MESSAGE_API_CHANNEL_SECRET, '')
};

let pushRequestToken = getOrElse(process.env.COVID19BOT_PUSH_TOKEN, '');
let lineUserId = getOrElse(process.env.LINE_USER_ID, '');

const client = new Client(config);
function handleEvent(event: WebhookEvent) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  client.replyMessage(event.replyToken, {
    type: 'text',
    text: event.message.text
  }).catch(e => {
    console.log(event);
    console.log(e.originalError.response.data);
  });

  return Promise.resolve(null);
}

const app = Express();
app.get('/', (req, res) => {
  res.send(getOrElse(process.env.SOURCE_VERSION, 'このプログラムにはイースターエッグ (隠し機能) はありません。'));
});
app.post('/webhook', middleware(config), (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result));
});
app.get('/push', (req, res) => {
  console.log(req.query)
  let r = req.query.token == pushRequestToken ? 'authorized' : 'unauthorized';
  let n = req.query.number;

  let f = () => {
    client.pushMessage(
      lineUserId,
      {
        type: 'text',
        text: `本日の新規感染者は${n}人、確認されました。`
      },
    );
  };
  let re = new Promise(f);
  res.send(r);
});

console.log('Starting the server...');

app.listen(parseInt(getOrElse(process.env.PORT, '3000')));
