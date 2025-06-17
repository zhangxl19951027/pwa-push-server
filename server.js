const express = require('express');
const webpush = require('web-push');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// 替换为你生成的 VAPID Keys
const publicVapidKey = 'BI5DkSF_y2i7ePRetT3LgV3RqUmr81ULV6TZUJ4-3-lBQXKEMdg3IU5-aNyoAS24GMdgS_cquGM2XE73b2yPI8k';
const privateVapidKey = 'hrBa8c94KaFk1-4-hSVFHOHTt4O09A_cbpK1rtkQ1zc';

webpush.setVapidDetails(
  'mailto:zhangxl19951027@163.com',
  publicVapidKey,
  privateVapidKey
);

let subscriptions = []; // 保存客户端订阅

// 接收客户端订阅信息
app.post('/subscribe', (req, res) => {
  const subscription = req.body;
  subscriptions.push(subscription);
  res.status(201).json({});
});

// 手动触发推送（测试用）
app.post('/sendNotification', async (req, res) => {
  const { title, body } = req.body;

  const payload = JSON.stringify({
    title,
    body,
  });

  // 给所有已订阅用户推送
  subscriptions.forEach(subscription => {
    webpush.sendNotification(subscription, payload).catch(error => {
      console.error('推送失败：', error);
    });
  });

  res.status(200).json({ message: '推送已发送' });
});

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(4000, () => console.log('服务启动：http://localhost:4000'));
