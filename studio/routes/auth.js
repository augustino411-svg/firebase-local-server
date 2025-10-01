import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// 註冊
router.post('/register', async (req, res) => {
  const { email, password, name, role, assignedClasses } = req.body;
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        name,
        role,
        assignedClasses,
        passwordHash, // ✅ 改為 passwordHash
      },
    });
    res.status(201).json({ message: '註冊成功', userId: user.id });
  } catch (err) {
    res.status(400).json({ error: '註冊失敗', detail: err });
  }
});

// 登入
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: '帳號不存在' });

    const valid = await bcrypt.compare(password, user.passwordHash); // ✅ 改為 passwordHash
    if (!valid) return res.status(401).json({ error: '密碼錯誤' });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ message: '登入成功', token });
  } catch (err) {
    res.status(500).json({ error: '登入失敗', detail: err });
  }
});

export default router;