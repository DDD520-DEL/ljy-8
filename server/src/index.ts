import express = require('express');
import cors = require('cors');
import dotenv = require('dotenv');
import authRoutes from './routes/auth';
import itemRoutes from './routes/items';
import skillRoutes from './routes/skills';
import orderRoutes from './routes/orders';
import reviewRoutes from './routes/reviews';
import disputeRoutes from './routes/disputes';
import queueRoutes from './routes/queue';
import notificationRoutes from './routes/notifications';
import neighborhoodRoutes from './routes/neighborhood';
import transactionRoutes from './routes/transactions';
import statsRoutes from './routes/stats';
import favoriteRoutes from './routes/favorites';
import followRoutes from './routes/follows';
import exchangeRoutes from './routes/exchange';
import announcementRoutes from './routes/announcements';
import donationRoutes from './routes/donations';
import demandRoutes from './routes/demands';
import verificationRoutes from './routes/verification';
import { db } from './utils/db';
import { initializeSampleData } from './utils/initData';
import { queueService } from './services/QueueService';

dotenv.config();

// 初始化示例数据
initializeSampleData();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/disputes', disputeRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/neighborhood', neighborhoodRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/follows', followRoutes);
app.use('/api/exchange', exchangeRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/demands', demandRoutes);
app.use('/api/verification', verificationRoutes);

app.get('/api/health', (_req: express.Request, res: express.Response) => {
  res.json({ success: true, message: '邻里共享平台服务运行中' });
});

setInterval(() => {
  try {
    queueService.checkAndExpireNotifiedEntries();
  } catch (err) {
    console.error('检查超时排队记录出错:', err);
  }
}, 60 * 1000);

app.listen(PORT, () => {
  console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
  console.log(`📊 健康检查: http://localhost:${PORT}/api/health`);
});

export default app;
