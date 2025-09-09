import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'

const router = Router()
const prisma = new PrismaClient()

// 查詢所有出勤紀錄
router.get('/', async (req: Request, res: Response) => {
  const { className, date } = req.query

  try {
    if (typeof className === 'string' && typeof date === 'string') {
      const records = await prisma.attendance.findMany({
        where: {
          className,
          date: new Date(date),
        },
      })
      return res.json(records)
    }

    if (typeof className === 'string') {
      const records = await prisma.attendance.findMany({
        where: { className },
      })
      return res.json(records)
    }

    const records = await prisma.attendance.findMany()
    res.json(records)
  } catch (error) {
    console.error('Error fetching attendance:', error)
    res.status(500).json({ message: '查詢失敗' })
  }
})

// 新增點名紀錄
router.post('/rollcall', async (req: Request, res: Response) => {
  const { attendance, students, className, date } = req.body

  if (!Array.isArray(students) || typeof attendance !== 'object') {
    return res.status(400).json({ success: false, message: '資料格式錯誤' })
  }

  try {
    const dateObj = new Date(date)
    const records = []

    for (const student of students) {
      const studentId = student.studentId
      const periods = attendance[studentId]

      for (const period in periods) {
        const status = periods[period]
        records.push({
          studentId,
          studentName: student.name,
          className,
          date: dateObj,
          period,
          status,
        })
      }
    }

    await prisma.attendance.createMany({ data: records })
    res.json({ success: true, count: records.length })
  } catch (error) {
    console.error('Error adding roll call records:', error)
    res.status(500).json({ success: false, message: '新增失敗' })
  }
})

// 匯入出勤資料
router.post('/import', async (req: Request, res: Response) => {
  const { records } = req.body

  if (!Array.isArray(records)) {
    return res.status(400).json({ success: false, message: '匯入資料格式錯誤' })
  }

  try {
    await prisma.attendance.createMany({ data: records })
    res.json({ success: true, count: records.length })
  } catch (error) {
    console.error('Error importing attendance:', error)
    res.status(500).json({ success: false, message: '匯入失敗' })
  }
})

export default router