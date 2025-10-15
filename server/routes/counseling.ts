import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const router = Router();
const prisma = new PrismaClient();

// ✅ 查詢所有輔導紀錄
router.get('/', async (req: Request, res: Response) => {
  try {
    const records = await prisma.counseling.findMany({
      orderBy: { date: 'desc' },
    });
    res.json(records);
  } catch (error) {
    console.error('❌ 查詢輔導紀錄失敗:', error);
    res.status(500).json({ message: '查詢失敗' });
  }
});

// ✅ 查詢某日某學生某類型的紀錄數量
router.get('/count', async (req: Request, res: Response) => {
  const { datePrefix, studentId, typePrefix } = req.query;

  if (
    typeof datePrefix !== 'string' ||
    typeof studentId !== 'string' ||
    typeof typePrefix !== 'string'
  ) {
    return res.status(400).json({ count: 0, message: '查詢參數格式錯誤' });
  }

  try {
    const count = await prisma.counseling.count({
      where: {
        studentId,
        counselingType: { startsWith: typePrefix },
        date: {
          gte: new Date(`${datePrefix}T00:00:00`),
          lt: new Date(`${datePrefix}T23:59:59`),
        },
      },
    });
    res.json({ count });
  } catch (error) {
    console.error('❌ 查詢輔導紀錄數量失敗:', error);
    res.status(500).json({ count: 0, message: '查詢失敗' });
  }
});

// ✅ 新增輔導紀錄（docId 為前端識別用，不進入 DB）
router.post('/:docId', async (req: Request, res: Response) => {
  const recordData = req.body;

  if (!recordData || typeof recordData !== 'object' || !recordData.date) {
    return res.status(400).json({ message: '資料格式錯誤' });
  }

  try {
    const created = await prisma.counseling.create({
      data: {
        ...recordData,
        date: new Date(recordData.date),
      },
    });
    res.status(201).json(created);
  } catch (error) {
    console.error('❌ 新增輔導紀錄失敗:', error);
    res.status(400).json({ message: '新增失敗' });
  }
});

// ✅ 刪除輔導紀錄
router.delete('/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ message: 'ID 無效' });
  }

  try {
    await prisma.counseling.delete({ where: { id } });
    res.json({ message: '刪除成功' });
  } catch (error) {
    console.error('❌ 刪除輔導紀錄失敗:', error);
    res.status(400).json({ message: '刪除失敗' });
  }
});

export default router;