import express from 'express'
import { PrismaClient } from '@prisma/client'

const router = express.Router()
const prisma = new PrismaClient()

router.post('/', async (req, res) => {
  try {
    const user = await prisma.user.create({
      data: {
        id: 1001, // ✅ 手動指定一個整數 ID（可改為其他值）
        name: '許宏再',
        email: '03210@cyvs.tyc.edu.tw',
        role: 'admin',
        assignedClasses: [],
        passwordHash: '12345678',
      },
    })
    res.json(user)
  } catch (error) {
    console.error('❌ 建立使用者失敗:', error)
    res.status(500).json({ error: '建立失敗' })
  }
})

router.get('/', (req, res) => {
  res.send('✅ seed-user 路由已啟用')
})


export default router