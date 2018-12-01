'use strict';

const aws = require('aws-sdk');
const line = require('@line/bot-sdk');
const lineClient = new line.Client({channelAccessToken: process.env.CHANNEL_ACCES_TOKEN});
const docClient = new aws.DynamoDB.DocumentClient({region: 'ap-northeast-1'});

const REQUEST_BY_FOOD = '食材で選ぶ';
const REQUEST_BY_CATEGORY = '料理のジャンルから選ぶ';
const REQUEST_BY_TIMES = '料理時間で選ぶ';

const questions = {
  'food': {
    'scenario': 1,
    'message': {
      'type': 'text',
      'text': '使う食材を教えてください',
    }
  },
  'category': {
    'scenario': 2,
    'message': {
      'type': 'text',
      'text': '料理のジャンルを教えてください',
    }
  },
  'times': {
    'scenario': 3,
    'message': {
      'type': 'text',
      'text': 'どのくらい時間をかけたいですか？',
    }
  },
}

const setState = (params) => {
  let item = {
    userId: params.userId,
    timestamp: params.timestamp,
    scenario: params.scenario,
  };
  let payload = {
    TableName: 'line-context',
    Item: item
  };

  docClient.put(payload, (err, data) => {
    if (err) {
      console.log(err);
    } else {
      console.log(data);
    }
  });
}

// AWS Lambda から呼び出される処理
exports.handler = (event, context, callback) => {
  console.log(event);
  const body = JSON.parse(event.body);

  // Response
  let response = { statusCode: 200 };

  body.events.some(async (lineEvent) => {
    let question = null;
    if (lineEvent.type === 'message' && lineEvent.message && lineEvent.message.type === 'text') {
      if (lineEvent.message.text === REQUEST_BY_FOOD) {
        question = questions.food;
      } else if (lineEvent.message.text === REQUEST_BY_CATEGORY) {
        question = questions.category;
      } else if (lineEvent.message.text === REQUEST_BY_TIMES) {
        question = questions.times;
      } else {
        //シナリオから処理を選ぶ
        
      }
      if (question) {
        console.log(lineEvent.replyToken);
        console.log(question);
        await setState({
          userId: lineEvent.source.userId,
          timestamp: lineEvent.timestamp,
          scenario: question.scenario,
        });
        await lineClient.replyMessage(lineEvent.replyToken, question.message);
        return true;
      }
    }
  });

  callback(null, response);
};
