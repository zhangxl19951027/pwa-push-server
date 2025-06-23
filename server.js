const express = require('express');
const webpush = require('web-push');
const bodyParser = require('body-parser');
const cors = require('cors');
const admin = require('firebase-admin');

// 从.env文件中读取配置
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

console.log('FCM_SERVICE_ACCOUNT:', process.env, process.env.FCM_SERVICE_ACCOUNT);

// 初始化 Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(process.env.FCM_SERVICE_ACCOUNT))
});

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

// 推送消息接口
app.post('/fcm_push', async (req, res) => {
  const { token, title, body, link = 'https://pwa-news-app.vercel.app/news/3' } = req.body;

  if (!token || !title || !body || !link) {
    return res.status(400).json({ error: '缺少必要参数' });
  }

  const message = {
    notification: { title, body },
    webpush: {
      notification: { click_action: link },
      fcmOptions: { link }
    },
    token
  };

  try {
    await new Promise(resolve => setTimeout(resolve, 5000));
    const response = await admin.messaging().send(message);
    console.log('推送成功:', response);
    res.status(200).json({ message: '推送已发送', success: true, response });
  } catch (error) {
    console.error('推送失败:', error);
    res.status(500).json({ success: false, error });
  }
});

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(4000, () => console.log('服务启动：http://localhost:4000'));
