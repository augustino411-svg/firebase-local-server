import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'

const router = Router()
const prisma = new PrismaClient()

router.get('/', async (req: Request, res: Response) => {
  try {
    const [students, attendance, counseling, bulletins, semesters, users] = await Promise.all([
      prisma.student.findMany(),
      prisma.attendance.findMany(),
      prisma.counseling.findMany(),
      prisma.bulletin.findMany(),
      prisma.semester.findMany(),
      prisma.user.findMany(),
    ])

    const backup = {
      students,
      attendance,
      counselingRecords: counseling,
      announcements: bulletins,
      semesters,
      users,
      exportedAt: new Date().toISOString(),
    }

    res.json(backup)
  } catch (error) {
    console.error('Error generating backup:', error)
    res.status(500).json({ message: '備份失敗' })
  }
})

export default router