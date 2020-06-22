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

let safe = (expr: string | undefined) => (expr ? expr : '');
const config = {
  channelAccessToken: safe(process.env.MESSAGE_API_CHANNEL_ACCESS_TOKEN),
  channelSecret: safe(process.env.MESSAGE_API_CHANNEL_SECRET)
};

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
app.post('/webhook', middleware(config), (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
});

console.log('Starting the server...');

app.listen(3000);
