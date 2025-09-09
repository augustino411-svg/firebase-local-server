import { Router } from 'express'
import { PrismaClient } from '@prisma/client'

const router = Router()
const prisma = new PrismaClient()

router.post('/', async (req, res) => {
  const backup = req.body
  try {
    let collectionCount = 0
    let documentCount = 0

    if (backup.students) {
      await prisma.student.deleteMany()
      await prisma.student.createMany({ data: backup.students })
      collectionCount++
      documentCount += backup.students.length
    }

    if (backup.attendance) {
      await prisma.attendance.deleteMany()
      await prisma.attendance.createMany({ data: backup.attendance })
      collectionCount++
      documentCount += backup.attendance.length
    }

    if (backup.counselingRecords) {
      await prisma.counseling.deleteMany()
      await prisma.counseling.createMany({ data: backup.counselingRecords })
      collectionCount++
      documentCount += backup.counselingRecords.length
    }

    if (backup.announcements) {
      await prisma.bulletin.deleteMany()
      await prisma.bulletin.createMany({ data: backup.announcements })
      collectionCount++
      documentCount += backup.announcements.length
    }

    if (backup.semesters) {
      await prisma.semester.deleteMany()
      await prisma.semester.createMany({ data: backup.semesters })
      collectionCount++
      documentCount += backup.semesters.length
    }

    if (backup.users) {
      await prisma.user.deleteMany()
      await prisma.user.createMany({ data: backup.users })
      collectionCount++
      documentCount += backup.users.length
    }

    res.json({ success: true, collectionCount, documentCount })
  } catch (error) {
    console.error('Restore error:', error)
    res.status(500).json({ success: false, message: '還原失敗' })
  }
})

export default router