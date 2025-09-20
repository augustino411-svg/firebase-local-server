import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'

const router = Router()
const prisma = new PrismaClient()

router.post('/seed-user', async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.create({
      data: {
        name: 'augustino411',
        email: 'augustino411@gmail.com',
        role: 'admin',
        assignedClasses: ['ADB1'],
        passwordHash: '12345678',
      },
    })
    res.json({ message: '已新增測試帳號', user })
  } catch (error) {
    console.error('Seed error:', error)
    res.status(500).json({ message: '新增失敗' })
  }
})

export default router