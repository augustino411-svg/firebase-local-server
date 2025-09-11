// server/index.ts

import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import dotenv from 'dotenv'

// 讀取環境變數
dotenv.config({ path: './.env' })

const app = express()

// ✅ 中介層設定
app.use(express.json())
app.use(cookieParser())

// ✅ CORS 設定：支援本地與雲端前端
const allowedOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000'
app.use(cors({ origin: allowedOrigin, credentials: true }))

// ✅ 路由模組掛載（依功能分群）

// 🔐 使用者驗證
import authRoutes from './routes/auth'
app.use('/api/auth', authRoutes)

// 👤 使用者管理
import userRoutes from './routes/userRoutes'
app.use('/api/user', userRoutes)

// 👨‍🎓 學生資料
import studentRoutes from './routes/students'
app.use('/api/students', studentRoutes)

// 🕒 出缺勤紀錄
import attendanceRoutes from './routes/attendance'
app.use('/api/attendance', attendanceRoutes)

// 📢 公告系統
import announcementRoutes from './routes/announcements'
app.use('/api/announcements', announcementRoutes)

// 🧠 輔導紀錄
import counselingRoutes from './routes/counseling'
app.use('/api/counseling', counselingRoutes)

// ⚙️ 系統設定
import settingsRoutes from './routes/settings'
app.use('/api/settings', settingsRoutes)

// 💾 備份與還原
import backupRoutes from './routes/backup'
app.use('/api/backup', backupRoutes)

import restoreRoutes from './routes/restore'
app.use('/api/restore', restoreRoutes)

// 🧪 開發測試工具（包含 /seed-user）
import devRoutes from './routes/dev'
app.use('/api/dev', devRoutes)

// ✅ 啟動伺服器
const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`✅ Express server running on http://localhost:${PORT}`)
})