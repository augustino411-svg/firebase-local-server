import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

process.on('uncaughtException', (err) => {
  console.error('❌ 未捕捉的例外錯誤:', err);
});

// 動態判斷執行環境位置
const isCompiled = __dirname.includes('dist');
const envPath = isCompiled
  ? path.resolve(__dirname, '.env')           // 編譯後執行 → dist/.env
  : path.resolve(__dirname, '../.env');       // 開發階段 → server/.env

dotenv.config(); // 不指定 path，讓 Render 自動注入環境變數

const app = express();
app.use(express.json());
app.use(cookieParser());

// ✅ CORS 設定（合併處理）
const allowedOrigins = process.env.CORS_ORIGINS?.split(',') ?? [];

app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = process.env.CORS_ORIGINS?.split(',') ?? [];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('❌ CORS blocked: ' + origin));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ✅ 健康檢查路由
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

// ✅ 路由模組掛載
import authRoutes from './routes/auth';
app.use('/api/auth', authRoutes);

import userRoutes from './routes/userRoutes';
app.use('/api/user', userRoutes);

import studentRoutes from './routes/students';
app.use('/api/students', studentRoutes);

import attendanceRoutes from './routes/attendance';
app.use('/api/attendance', attendanceRoutes);

import announcementRoutes from './routes/announcements';
app.use('/api/announcements', announcementRoutes);

import counselingRoutes from './routes/counseling';
app.use('/api/counseling', counselingRoutes);

import settingsRoutes from './routes/settings';
app.use('/api/settings', settingsRoutes);

import backupRoutes from './routes/backup';
app.use('/api/backup', backupRoutes);

import restoreRoutes from './routes/restore';
app.use('/api/restore', restoreRoutes);

import devRoutes from './routes/dev';
app.use('/api/dev', devRoutes);

// ✅ 新增 seed-user 路由（保留原有功能）
import seedUserRouter from './routes/seed-user';
app.use('/api', seedUserRouter);

// ✅ 啟動伺服器
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Express server running on http://localhost:${PORT}`);
});