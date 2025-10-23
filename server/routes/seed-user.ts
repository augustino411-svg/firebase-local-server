import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const router = Router();
const prisma = new PrismaClient();

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
        role: 'admin',
        passwordHash: '12345678',
        assignedClasses: {
          create: [
            { code: 'ADB1' },
            { code: 'ADB2' }
          ]
        } as any // ✅ 強制轉型，讓 Render 編譯通過
      }
    });


    res.status(201).json({ message: '已新增測試帳號', user });
  } catch (error: any) {
    console.error('❌ 建立測試帳號失敗:', error);
    res.status(500).json({ message: '新增失敗', error: error.message });
  }
});

export default router;