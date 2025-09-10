import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'

const router = Router()
const prisma = new PrismaClient()

router.get('/debug-user', async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany()
    console.log('所有使用者:', users)
    res.json({ users })
  } catch (error) {
    console.error('Debug error:', error)
    res.status(500).json({ message: '查詢失敗' })
  }
})


export default router