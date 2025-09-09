import { Router } from 'express'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const router = Router()
const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET!

router.post('/login', async (req, res) => {
  const { email, password } = req.body
  const user = await prisma.user.findFirst({ where: { email, code: password } })

  if (!user) return res.status(401).json({ message: '帳號或密碼錯誤' })

  const token = jwt.sign({ uid: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' })

  res.cookie('token', token, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  })

  res.json({ id: user.id, ...user })
})

router.post('/logout', (req, res) => {
  res.clearCookie('token')
  res.json({ message: '已登出' })
})

router.get('/me', async (req, res) => {
  const token = req.cookies.token
  if (!token) return res.status(401).json({ user: null })

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { uid: string }
    const user = await prisma.user.findUnique({ where: { id: decoded.uid } })
    if (!user) return res.status(404).json({ user: null })
    res.json({ user })
  } catch {
    res.status(401).json({ user: null })
  }
})

export default router