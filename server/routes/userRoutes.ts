import express from 'express';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const router = express.Router();
const prisma = new PrismaClient();

// ✅ 查詢所有使用者
router.get('/', async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    console.error('❌ 查詢使用者失敗:', error);
    res.status(500).json({ message: '查詢失敗' });
  }
});

export default router;