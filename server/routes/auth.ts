import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET!;
const sameSiteValue = (process.env.COOKIE_SAMESITE ?? 'none') as 'none' | 'lax' | 'strict';
const cookieSecure = process.env.COOKIE_SECURE === 'true';

// ✅ 登入（保留明文密碼比對）
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  console.log('登入請求:', { email });

  if (!email || !password) {
    return res.status(400).json({ message: '請提供帳號與密碼' });
  }

  try {
    const user = await prisma.user.findFirst({
      where: { email, passwordHash: password },
    });

    console.log('查詢結果:', user);

    if (!user) {
      return res.status(401).json({ message: '帳號或密碼錯誤' });
    }

    const tokenPayload = { uid: user.id, role: user.role, email: user.email };
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: cookieSecure,
      sameSite: sameSiteValue,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    console.log('✅ Set-Cookie headers:', res.getHeaders()['set-cookie']);

    const { passwordHash, ...safeUser } = user;
    res.json(safeUser);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: '登入失敗', error: String(error) });
  }
});

// ✅ 登出
router.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: cookieSecure,
    sameSite: sameSiteValue,
  });
  res.json({ message: '已登出' });
});

// ✅ 取得目前使用者
router.get('/me', async (req: Request, res: Response) => {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ user: null, message: '未登入' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { uid: number; role: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.uid },
    });

    if (!user) return res.status(404).json({ user: null, message: '使用者不存在' });

    const { passwordHash, ...safeUser } = user;
    res.json({ user: safeUser });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ user: null, message: 'Token 驗證失敗' });
  }
});

export default router;