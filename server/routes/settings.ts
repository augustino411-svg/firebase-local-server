import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const router = Router();
const prisma = new PrismaClient();

function calculateSchoolDays(
  start: Date,
  end: Date,
  holidays: string[],
  extraHolidays: string[]
): number {
  const allHolidays = new Set([...holidays, ...extraHolidays]);
  let count = 0;
  const current = new Date(start);
  while (current <= end) {
    const dateStr = current.toISOString().slice(0, 10);
    const isWeekend = current.getDay() === 0 || current.getDay() === 6;
    const isHoliday = allHolidays.has(dateStr);
    if (!isWeekend && !isHoliday) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
}

// ✅ 儲存或更新學期設定
router.post('/', async (req: Request, res: Response) => {
  const {
    academicYear,
    semester,
    label,
    startDate,
    endDate,
    holidays,
    holidayDates,
    permissions,
  } = req.body;

  if (!academicYear || !semester || !startDate || !endDate) {
    return res.status(400).json({ message: '缺少必要欄位' });
  }

  try {
    const totalSchoolDays = calculateSchoolDays(
      new Date(startDate),
      new Date(endDate),
      holidays || [],
      holidayDates || []
    );

    const existing = await prisma.semester.findFirst({
      where: { academicYear, semester },
    });

    const data = {
      academicYear,
      semester,
      label,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      holidays,
      holidayDates,
      totalSchoolDays,
      permissions,
    };

    const result = existing
      ? await prisma.semester.update({ where: { id: existing.id }, data })
      : await prisma.semester.create({ data });

    res.json(result);
  } catch (error) {
    console.error('❌ 儲存學期設定失敗:', error);
    res.status(400).json({ message: '儲存失敗' });
  }
});

// ✅ 查詢所有學期設定
router.get('/', async (req: Request, res: Response) => {
  try {
    const semesters = await prisma.semester.findMany({
      orderBy: { startDate: 'desc' },
    });
    res.json(semesters);
  } catch (error) {
    console.error('❌ 查詢學期設定失敗:', error);
    res.status(500).json({ message: '查詢失敗' });
  }
});

// ✅ 查詢目前學期（最新一筆）
router.get('/current', async (req: Request, res: Response) => {
  try {
    const current = await prisma.semester.findFirst({
      orderBy: { startDate: 'desc' },
    });
    res.json(current);
  } catch (error) {
    console.error('❌ 查詢目前學期失敗:', error);
    res.status(500).json({ message: '查詢失敗' });
  }
});

// ✅ 刪除學期設定
router.delete('/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ message: 'ID 無效' });
  }

  try {
    await prisma.semester.delete({ where: { id } });
    res.json({ message: '刪除成功' });
  } catch (error) {
    console.error('❌ 刪除學期設定失敗:', error);
    res.status(400).json({ message: '刪除失敗' });
  }
});

export default router;