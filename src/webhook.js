'use strict';

const aws = require('aws-sdk');
const line = require('@line/bot-sdk');
const lineClient = new line.Client({channelAccessToken: process.env.CHANNEL_ACCES_TOKEN});
const docClient = new aws.DynamoDB.DocumentClient({region: 'ap-northeast-1'});

const REQUEST_BY_FOOD = '食材で選ぶ';
const REQUEST_BY_CATEGORY = '料理のジャンルから選ぶ';
const REQUEST_BY_TIMES = '料理時間で選ぶ';

const SCENARIO_ID_FOOD = 1;
const SCENARIO_ID_CATEGORY = 2;
const SCENARIO_ID_TIMES = 3;

const tableName = 'line-context';

const questions = {
  'food': {
    'scenario': SCENARIO_ID_FOOD,
    'message': {
      'type': 'text',
      'text': '使う食材を教えてください',
    }
  },
  'category': {
    'scenario': SCENARIO_ID_CATEGORY,
    'message': {
      'type': 'text',
      'text': '料理のジャンルを教えてください',
    }
  },
  'times': {
    'scenario': SCENARIO_ID_TIMES,
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
    TableName: tableName,
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

const getState = async (userId) => {
  let query = {
    TableName: tableName,
    Key: {
      'userId': userId
    }
  };

  let data = null;
  try {
    data = await docClient.get(query).promise();
  } catch (err) {
    console.log(err);
  }
  return data;
}

// AWS Lambda から呼び出される処理
exports.handler = (event, context, callback) => {
  console.log(event);
  const body = JSON.parse(event.body);

  // Response
  let response = { statusCode: 200 };

  body.events.some(async (lineEvent) => {
    let question = null;
    let answer = null;
    if (lineEvent.type === 'message' && lineEvent.message && lineEvent.message.type === 'text') {
      if (lineEvent.message.text === REQUEST_BY_FOOD) {
        question = questions.food;
      } else if (lineEvent.message.text === REQUEST_BY_CATEGORY) {
        question = questions.category;
      } else if (lineEvent.message.text === REQUEST_BY_TIMES) {
        question = questions.times;
      } else {
        //シナリオから処理を選ぶ
        let state = await getState(lineEvent.source.userId);
        console.log('state = ' + state);
        if (state) {
          console.log('Current state is: ' + state);
          if (state.Item.scenario) {
            if (state.Item.scenario === SCENARIO_ID_FOOD) {
              answer = '探してます';
            } else {
              let number = lineEvent.message.text * 1;
              if (number > 0) {
                answer = '探してます';
              } else {
                answer = '数字で入力してください';
              }
            }
          }
        }
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
      } else if (answer) {
        console.log(lineEvent.replyToken);
        console.log(answer);
        await lineClient.replyMessage(lineEvent.replyToken, {
          'type': 'text',
          'text': answer,
        });
        return true;
      }
    }
  });

  callback(null, response);
};
