import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const router = Router();
const prisma = new PrismaClient();

// ✅ 還原備份資料
router.post('/', async (req: Request, res: Response) => {
  const backup = req.body;

  if (!backup || typeof backup !== 'object') {
    return res.status(400).json({ success: false, message: '備份資料格式錯誤' });
  }

  try {
    let collectionCount = 0;
    let documentCount = 0;

    const restore = async (key: keyof typeof backup, model: any) => {
      const data = backup[key];
      if (Array.isArray(data)) {
        await model.deleteMany();
        await model.createMany({ data, skipDuplicates: true });
        collectionCount++;
        documentCount += data.length;
      }
    };

    await restore('students', prisma.student);
    await restore('attendance', prisma.attendance);
    await restore('counselingRecords', prisma.counseling);
    await restore('announcements', prisma.bulletin);
    await restore('semesters', prisma.semester);
    await restore('users', prisma.user);

    res.json({ success: true, collectionCount, documentCount });
  } catch (error) {
    console.error('❌ 還原資料失敗:', error);
    res.status(500).json({ success: false, message: '還原失敗' });
  }
});

export default router;