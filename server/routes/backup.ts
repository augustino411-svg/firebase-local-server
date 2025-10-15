import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const router = Router();
const prisma = new PrismaClient();

// ✅ 匯出所有資料備份
router.get('/', async (req: Request, res: Response) => {
  try {
    const [students, attendance, counseling, bulletins, semesters, users] = await Promise.all([
      prisma.student.findMany(),
      prisma.attendance.findMany(),
      prisma.counseling.findMany(),
      prisma.bulletin.findMany(),
      prisma.semester.findMany(),
      prisma.user.findMany(),
    ]);

    const backup = {
      students,
      attendance,
      counselingRecords: counseling,
      announcements: bulletins,
      semesters,
      users,
      exportedAt: new Date().toISOString(),
    };

    res.json(backup);
  } catch (error) {
    console.error('❌ 備份資料失敗:', error);
    res.status(500).json({ message: '備份失敗' });
  }
});

export default router;