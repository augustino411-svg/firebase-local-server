import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import dotenv from 'dotenv'
import devRoutes from './routes/dev'
app.use('/api/dev', devRoutes)


// 讀取環境變數
dotenv.config({ path: './.env' })

const app = express()

// CORS 設定：支援本地與雲端前端
const allowedOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000'
app.use(cors({ origin: allowedOrigin, credentials: true }))

app.use(express.json())
app.use(cookieParser())

// 路由模組（副檔名省略，讓 TypeScript 自動解析）
import authRoutes from './routes/auth'
app.use('/api/auth', authRoutes)

import studentRoutes from './routes/students'
app.use('/api/students', studentRoutes)

import attendanceRoutes from './routes/attendance'
app.use('/api/attendance', attendanceRoutes)

import announcementRoutes from './routes/announcements'
app.use('/api/announcements', announcementRoutes)

import counselingRoutes from './routes/counseling'
app.use('/api/counseling', counselingRoutes)

import settingsRoutes from './routes/settings'
app.use('/api/settings', settingsRoutes)

import backupRoutes from './routes/backup'
app.use('/api/backup', backupRoutes)

import restoreRoutes from './routes/restore'
app.use('/api/restore', restoreRoutes)

// 啟動伺服器
const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`✅ Express server running on http://localhost:${PORT}`)
})

