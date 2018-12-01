'use strict';

const aws = require('aws-sdk');
const docClient = new aws.DynamoDB.DocumentClient({region: 'ap-northeast-1'});

const REQUEST_BY_MATERIAL = '食材で選ぶ';
const REQUEST_BY_CATEGORY = '料理のジャンルから選ぶ';
const REQUEST_BY_WORK_TIME = '料理時間で選びます';

const QUESTION_ABOUT_MATERIAL = '使う食材を教えてください';
const QUESTION_ABOUT_CATEGORY = '今日の気分に合うジャンルを選んでください';
const QUESTION_ABOUT_WORK_TIME = '調理時間を選んでください';

// AWS Lambda から呼び出される処理
exports.handler = (event, context, callback) => {
  console.log(event);

  // Redirect
  let response = {
    "statusCode": 200,
    "headers": {
       "Content-Type": "application/json",
       'Access-Control-Allow-Origin': '*',
       'Access-Control-Allow-Credentials': 'true',
    },
    "body": JSON.stringify({
      result: 'success'
    })
  };

  const body = JSON.parse(event.body);

  body.events.map((lineEvent) => {
      let item = {
        userId: lineEvent.source.userId,
        timestamp: lineEvent.timestamp,
        replyToken: lineEvent.replyToken,
        material: 'M',
        category: 'C',
        workTime: 'T',
      };
    
      var params = {
        TableName: 'line-context',
        Item: item
      };
    
      docClient.put(params, (err, data) => {
        if (err) {
          console.log(err);
        } else {
          console.log(data);
        }
      });
    });

  callback(null, response);
};
