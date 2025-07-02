const express = require('express');
const webpush = require('web-push');
const bodyParser = require('body-parser');
const cors = require('cors');
const admin = require('firebase-admin');

// 从.env文件中读取配置
console.log('***************server start********');
console.log('***************ENV********', process.env);
console.log('***************Node_ENV********', process.env.NODE_ENV);
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

console.log('All ENV keys:', Object.keys(process.env));

console.log('FCM_SERVICE_ACCOUNT:', process.env.FCM_SERVICE_ACCOUNT);

const serviceAccount = JSON.parse(process.env.FCM_SERVICE_ACCOUNT);

if (process.env.NODE_ENV === 'production') {
  serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
}

// 初始化 Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
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

app.post('/collect', (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: '缺少参数' });
  console.log('接收到收藏:', id);
  // 处理业务逻辑（写数据库、统计）
  res.status(200).json({ success: true });
});

app.get('/news_list', (req, res) => {
  console.log('获取新闻列表');
  res.status(200).json({ 
    success: true, 
    list: [
      {
        "id": 100,
        "title": "智能机器人走进家庭",
        "desc": "智能家居公司推出新款服务机器人，可承担家务、陪伴老人小孩。",
        "content": "某智能家居公司近日推出了一款新型服务机器人，该机器人具备智能导航、语音交互、图像识别等功能，能够完成打扫卫生、做饭、照顾老人小孩等多种任务。该机器人采用了先进的人工智能算法，能够根据用户的习惯和需求进行个性化服务。市场分析人士认为，这款机器人的推出将推动智能家居市场进入一个新的发展阶段。",
        "imgs": ["https://img2.baidu.com/it/u=1465309672,2383318751&fm=253&fmt=auto&app=138&f=JPEG?w=678&h=380"],
        "author": "家电周刊 王强",
        "create_time": "2024-03-17 14:30:10"
      },
      {
        id: 101,
        title: "全球首款全息手机问世",
        desc: "一家初创公司推出了一款革命性的全息智能手机，可以在空中投影出三维图像。",
        content:
          "这家名为HoloTech的公司在旧金山举办了一场发布会，展示了他们最新的产品 - HoloPhone X。这款手机采用先进的激光技术和特殊的屏幕材料，可以将手机上的内容以全息形式投射到空气中。用户可以通过手势控制来操作这些全息界面，而无需直接触摸屏幕。虽然目前的价格较高，但该公司表示，随着技术的进步，价格将会下降。",
        "imgs": ["https://gimg2.baidu.com/image_search/src=http%3A%2F%2Fcbu01.alicdn.com%2Fimg%2Fibank%2F2018%2F183%2F934%2F8924439381_1827816472.jpg&refer=http%3A%2F%2Fcbu01.alicdn.com&app=2002&size=f9999,10000&q=a80&n=0&g=0n&fmt=auto?sec=1754033015&t=b4df68bd41ce0f734e59f3459c1632ef"],
        author: "数码世界 李娜",
        create_time: "2024-03-14 09:15:32"
      },
      {
        id: 102,
        title: "人工智能首次击败围棋世界冠军",
        desc: "一款名为AlphaGo的人工智能程序在一场激烈的比赛中战胜了世界顶级围棋选手。",
        content:
          "这场历史性的比赛在北京举行，吸引了全世界的关注。AlphaGo是由DeepMind公司开发的一款人工智能程序，它使用深度学习算法来分析和预测对手的棋路。在这场比赛中，AlphaGo展现出了惊人的计算能力和策略思维，最终以4比1的比分战胜了人类选手。这场比赛标志着人工智能在复杂决策制定方面取得了重大突破。",
        "imgs": ["https://img0.baidu.com/it/u=3460318404,828505024&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=500", 'https://pic.rmb.bdstatic.com/bjh/250515/dump/063cc88b6aa348b61578b168aa1663de.jpeg', 'https://miaobi-lite.bj.bcebos.com/miaobi/5mao/b%27MF8xNzI4MTExNDEwLjk0MDQ1NzY%3D%27/0.png'],
        author: "体育快报 王强",
        create_time: "2024-03-13 16:45:18"
      },
      {
        id: 103,
        title: "新型疫苗成功阻止病毒传播",
        desc: "一种新的疫苗在临床试验中显示出极高的效果，能够有效防止一种致命病毒的传播。",
        content:
          "这种名为VaxiGuard的疫苗由一家生物制药公司研发，经过多轮严格的临床试验后，结果显示其有效性高达99%。该疫苗采用了创新的技术，能够在短时间内激发人体免疫系统的强烈反应。专家们认为，这种疫苗可能会成为对抗该病毒的关键武器，并有望在未来几个月内获得批准并投入市场。",
        "imgs": [],
        author: "健康时报 刘敏",
        create_time: "2024-03-12 11:30:45"
      },
      {
        id: 104,
        title: "全球最大太阳能飞机完成环球飞行",
        desc: "一架名为SolarStratos的太阳能飞机完成了它的首次环球飞行，创造了历史。",
        content:
          "这架飞机从瑞士起飞，历时数月，穿越多个国家，最终成功返回起点。SolarStratos是一架完全依靠太阳能驱动的飞机，它的翼展超过80米，上面安装了大量的太阳能电池板。这次环球飞行不仅证明了太阳能技术的巨大潜力，也为未来的绿色航空业奠定了基础。",
        "imgs": [],
        author: "航空航天周刊 赵磊",
        create_time: "2024-03-11 14:20:10"
      },
      {
        id: 105,
        title: "虚拟现实技术改变教育方式",
        desc: "一项新的研究表明，虚拟现实技术正在改变我们的教学方式，提高学生的学习体验。",
        content:
          "这项研究由一所知名大学进行，结果显示，使用虚拟现实技术进行教学的学生比传统教学方法的学生表现更好。虚拟现实技术可以让学生身临其境地体验各种场景，从而更好地理解和记忆知识。此外，它还可以帮助教师更有效地传授复杂的概念。许多学校已经开始引入虚拟现实设备，并将其融入日常教学中。",
        imgs: [],
        author: "教育报 钱芳",
        create_time: "2024-03-10 17:15:30"
      },
      {
        id: 106,
        title: "自动驾驶汽车进入商业化阶段",
        desc: "多家汽车制造商宣布，他们的自动驾驶汽车将在今年年底正式上市销售。",
        content:
          "这意味着自动驾驶技术已经进入了商业化阶段，消费者很快就能购买到具备自动驾驶功能的汽车。这些汽车配备了先进的传感器和人工智能系统，可以自动识别道路状况并做出相应的驾驶决策。尽管目前还需要驾驶员随时准备接管，但这已经是迈向完全自动驾驶的重要一步。专家预计，未来几年内，自动驾驶汽车将成为市场的主流。",
        imgs: [],
        author: "汽车之家 孙浩",
        create_time: "2024-03-09 10:05:45"
      },
      {
        id: 107,
        title: "基因编辑技术治疗遗传病取得突破",
        desc: "科学家们利用基因编辑技术成功治愈了一种罕见的遗传性疾病，为医学界带来了希望。",
        content:
          "这项研究由一支国际科研团队完成，他们在实验中使用CRISPR-Cas9技术对患者的DNA进行了精确修改，成功修复了导致疾病的突变基因。这是基因编辑技术在临床应用中的一个重要里程碑，表明这种方法有可能用于治疗多种遗传性疾病。研究人员表示，接下来将进一步测试该技术的安全性和长期效果，以便尽快将其应用于临床治疗。",
        imgs: [],
        author: "生命科学 周晓",
        create_time: "2024-03-08 13:20:15"
      },
      {
        id: 108,
        title: "量子计算机实现重大进展",
        desc: "一台新型量子计算机在实验室中实现了前所未有的计算速度，标志着量子计算领域的巨大进步。",
        content:
          "这台量子计算机由一家科技巨头研发，其运算速度远超现有的超级计算机。量子计算机利用量子位来进行计算，理论上可以在极短的时间内解决某些特定问题。这项新技术有望在药物发现、材料 science 和密码学等领域带来革命性的变化。研究人员表示，他们将继续改进这项技术，使其更加稳定可靠。",
        imgs: [],
        author: "计算机世界 吴军",
        create_time: "2024-03-07 16:10:50"
      },
      {
        id: 109,
        title: "环保组织发起塑料禁令运动",
        desc: "多个环保组织联合发起了一项倡议，呼吁各国政府禁止一次性塑料制品的生产和使用。",
        content:
          "这项倡议得到了广泛的响应和支持，已有数十个国家承诺将采取措施减少塑料污染。环保组织指出，一次性塑料制品是海洋污染的主要来源之一，它们会对生态系统造成严重破坏。为了应对这一挑战，他们建议推广可降解材料的使用，并加强对塑料回收和再利用的投资。这项运动的成功与否将取决于全球范围内的合作和行动。",
        imgs: [],
        author: "环境保护报 郑洁",
        create_time: "2024-03-06 12:35:25"
      }
    ]
  });
});

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(4000, () => console.log('服务启动：http://localhost:4000'));
