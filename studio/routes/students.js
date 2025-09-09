import express from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

// 查詢所有學生
router.get('/', async (req, res) => {
  try {
    const students = await prisma.student.findMany();
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: '查詢失敗', detail: err });
  }
});

// 新增學生
router.post('/', async (req, res) => {
  const { name, email } = req.body;
  try {
    const student = await prisma.student.create({
      data: { name, email },
    });
    res.status(201).json(student);
  } catch (err) {
    res.status(400).json({ error: '新增失敗', detail: err });
  }
});

export default router;