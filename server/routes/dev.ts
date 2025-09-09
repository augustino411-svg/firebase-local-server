import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'

const router = Router()
const prisma = new PrismaClient()

router.get('/debug-user', async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findFirst({
      where: {
        email: 'augustino411@gmail.com',
        passwordHash: '12345678',
      },
    })
    res.json({ user })
  } catch (error) {
    console.error('Debug error:', error)
    res.status(500).json({ message: '查詢失敗' })
  }
})

export default router