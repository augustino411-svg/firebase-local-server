import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import studentsRouter from './studio/routes/students.js'; // 注意副檔名
import authRouter from './studio/routes/auth.js';

const app = express(); // ✅ 提前宣告 app

app.use(express.static('public'));

// 中介層：請求紀錄
app.use((req, res, next) => {
  console.log(`📥 收到請求：${req.method} ${req.url}`);
  next();
});

app.use(cors());
app.use(express.json());

// 路由掛載
app.use('/api/auth', authRouter); // ✅ 現在 app 已初始化
app.use('/api/students', studentsRouter);

// 根路由
app.get('/', (req, res) => {
  res.send('✅ 本機伺服器已啟動，Firebase 已移除');
});

// 啟動伺服器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});