'use strict';

const aws = require('aws-sdk');
const line = require('@line/bot-sdk');
const lineClient = new line.Client({channelAccessToken: process.env.CHANNEL_ACCES_TOKEN});
const docClient = new aws.DynamoDB.DocumentClient({region: 'ap-northeast-1'});

const REQUEST_BY_MATERIAL = '食材で選ぶ';
const REQUEST_BY_CATEGORY = '料理のジャンルから選ぶ';
const REQUEST_BY_WORK_TIME = '料理時間で選びます';

const questionForMaterial = {
  'type': 'text',
  'text': '使う食材を教えてください',
};

const questionForCategory = {
  'type': 'text',
  'text': '今日の気分に合うジャンルを選んでください',
};

const questionForWorkTime = {
  'type': 'text',
  'text': '調理時間を選んでください',
};

// AWS Lambda から呼び出される処理
exports.handler = (event, context, callback) => {
  console.log(event);
  const body = JSON.parse(event.body);

  // Response
  let response = { statusCode: 200 };

  body.events.some(async (lineEvent) => {
    let message = null;
    if (lineEvent.type === 'message' && lineEvent.message && lineEvent.message.type === 'text') {
      if (lineEvent.message.text === REQUEST_BY_MATERIAL) {
        message = questionForMaterial;
      } else if (lineEvent.message.text === REQUEST_BY_CATEGORY) {
        message = questionForCategory;
      } else if (lineEvent.message.text === REQUEST_BY_WORK_TIME) {
        message = questionForWorkTime;
      }
      if (message) {
        console.log(lineEvent.replyToken);
        console.log(message);
        await lineClient.replyMessage(lineEvent.replyToken, message);
        return true;
      }
    }
  });

  callback(null, response);
};
