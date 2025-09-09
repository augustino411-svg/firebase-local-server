import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config({ path: './.env' })
const app = express()
app.use(cors({ origin: 'http://localhost:3000', credentials: true }))
app.use(express.json())
app.use(cookieParser())

import authRoutes from './routes/auth.js'
app.use('/api/auth', authRoutes)
import studentRoutes from './routes/students.js'
app.use('/api/students', studentRoutes)
import attendanceRoutes from './routes/attendance.js'
app.use('/api/attendance', attendanceRoutes)
import announcementRoutes from './routes/announcements.js'
app.use('/api/announcements', announcementRoutes)
import counselingRoutes from './routes/counseling.js'
app.use('/api/counseling', counselingRoutes)
import settingsRoutes from './routes/settings.js'
app.use('/api/settings', settingsRoutes)
import backupRoutes from './routes/backup.js'
app.use('/api/backup', backupRoutes)
import restoreRoutes from './routes/restore.js'
app.use('/api/restore', restoreRoutes)


const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`✅ Express server running on http://localhost:${PORT}`)
})