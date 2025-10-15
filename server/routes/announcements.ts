import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const router = Router();
const prisma = new PrismaClient();

// ✅ 查詢所有公告
router.get('/', async (req: Request, res: Response) => {
  try {
    const announcements = await prisma.bulletin.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(announcements);
  } catch (error) {
    console.error('❌ 查詢公告失敗:', error);
    res.status(500).json({ message: '查詢失敗' });
  }
});

// ✅ 查詢某日公告數量（prefix = "2025-09-08"）
router.get('/count', async (req: Request, res: Response) => {
  const { prefix } = req.query;
  if (typeof prefix !== 'string') {
    return res.status(400).json({ count: 0, message: 'prefix 必須是字串' });
  }

  try {
    const count = await prisma.bulletin.count({
      where: {
        createdAt: {
          gte: new Date(`${prefix}T00:00:00`),
          lt: new Date(`${prefix}T23:59:59`),
        },
      },
    });
    res.json({ count });
  } catch (error) {
    console.error('❌ 查詢公告數量失敗:', error);
    res.status(500).json({ count: 0, message: '查詢失敗' });
  }
});

// ✅ 新增公告
router.post('/', async (req: Request, res: Response) => {
  const { title, content, user } = req.body;
  if (!user?.name || !user?.email || !title || !content) {
    return res.status(400).json({ message: '缺少必要欄位' });
  }

  try {
    const announcement = await prisma.bulletin.create({
      data: {
        title,
        content,
        authorName: user.name,
        authorEmail: user.email,
        createdAt: new Date(),
      },
    });
    res.status(201).json(announcement);
  } catch (error) {
    console.error('❌ 新增公告失敗:', error);
    res.status(400).json({ message: '新增失敗' });
  }
});

// ✅ 更新公告
router.patch('/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const { title, content, user } = req.body;
  if (!user?.name || !user?.email || !title || !content || isNaN(id)) {
    return res.status(400).json({ message: '缺少必要欄位或 ID 無效' });
  }

  try {
    const updated = await prisma.bulletin.update({
      where: { id },
      data: {
        title,
        content,
        authorName: user.name,
        authorEmail: user.email,
      },
    });
    res.json(updated);
  } catch (error) {
    console.error('❌ 更新公告失敗:', error);
    res.status(400).json({ message: '更新失敗' });
  }
});

// ✅ 刪除公告
router.delete('/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ message: 'ID 無效' });
  }

  try {
    await prisma.bulletin.delete({ where: { id } });
    res.json({ message: '刪除成功' });
  } catch (error) {
    console.error('❌ 刪除公告失敗:', error);
    res.status(400).json({ message: '刪除失敗' });
  }
});

export default router;