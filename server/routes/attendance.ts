import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const router = Router();
const prisma = new PrismaClient();

// ✅ 查詢所有出勤紀錄（支援 className 與 date 篩選）
router.get('/', async (req: Request, res: Response) => {
  const { className, date } = req.query;

  try {
    if (typeof className === 'string' && typeof date === 'string') {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        return res.status(400).json({ message: '日期格式錯誤' });
      }

      const records = await prisma.attendance.findMany({
        where: { className, date: dateObj },
      });
      return res.json(records);
    }

    if (typeof className === 'string') {
      const records = await prisma.attendance.findMany({ where: { className } });
      return res.json(records);
    }

    const records = await prisma.attendance.findMany();
    res.json(records);
  } catch (error) {
    console.error('❌ 查詢出勤紀錄失敗:', error);
    res.status(500).json({ message: '查詢失敗' });
  }
});

// ✅ 新增點名紀錄
router.post('/rollcall', async (req: Request, res: Response) => {
  const { attendance, students, className, date } = req.body;

  if (!Array.isArray(students) || typeof attendance !== 'object') {
    return res.status(400).json({ success: false, message: '資料格式錯誤' });
  }

  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return res.status(400).json({ success: false, message: '日期格式錯誤' });
    }

    const records = [];

    for (const student of students) {
      const studentId = student.studentId;
      const periods = attendance[studentId];

      for (const period in periods) {
        const status = periods[period];
        records.push({
          studentId,
          studentName: student.name,
          className,
          date: dateObj,
          period,
          status,
        });
      }
    }

    await prisma.attendance.createMany({
      data: records,
      skipDuplicates: true, // ✅ 可選：防止重複資料錯誤
    });

    res.json({ success: true, count: records.length });
  } catch (error) {
    console.error('❌ 新增點名紀錄失敗:', error);
    res.status(500).json({ success: false, message: '新增失敗' });
  }
});

// ✅ 匯入出勤資料
router.post('/import', async (req: Request, res: Response) => {
  const { records } = req.body;

  if (!Array.isArray(records)) {
    return res.status(400).json({ success: false, message: '匯入資料格式錯誤' });
  }

  try {
    await prisma.attendance.createMany({
      data: records,
      skipDuplicates: true, // ✅ 可選
    });
    res.json({ success: true, count: records.length });
  } catch (error) {
    console.error('❌ 匯入出勤資料失敗:', error);
    res.status(500).json({ success: false, message: '匯入失敗' });
  }
});

export default router;