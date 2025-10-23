import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const router = Router();
const prisma = new PrismaClient();

// ✅ 建立測試帳號（明文密碼僅限測試用途）
router.post('/seed-user', async (req: Request, res: Response) => {
  try {
    const email = 'augustino411@gmail.com';

    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      return res.status(200).json({ message: '帳號已存在', user: existing });
    }

    const user = await prisma.user.create({
      data: {
        name: 'augustino411',
        email,
        passwordHash: '12345678', // ❗ 僅限測試用途，正式環境請加密
        role: 'admin',
        assignedClasses: {
          create: [
            { code: 'ADB1' },
            { code: 'ADB2' }
          ]
        },
      },
    });

    res.status(201).json({ message: '已新增測試帳號', user });
  } catch (error) {
    console.error('❌ 建立測試帳號失敗:', error);
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

export default router;