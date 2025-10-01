"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// 查詢所有公告
router.get('/', async (req, res) => {
    try {
        const announcements = await prisma.bulletin.findMany({
            orderBy: { createdAt: 'desc' },
        });
        res.json(announcements);
    }
    catch (error) {
        console.error('Error fetching announcements:', error);
        res.status(500).json({ message: '查詢失敗' });
    }
});
// 查詢某日公告數量（prefix = "2025-09-08"）
router.get('/count', async (req, res) => {
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
    }
    catch (error) {
        console.error('Error counting announcements:', error);
        res.status(500).json({ count: 0 });
    }
});
// 新增公告
router.post('/', async (req, res) => {
    const { title, content, user } = req.body;
    if (!user?.name || !user?.email) {
        return res.status(400).json({ message: '缺少使用者資訊' });
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
    }
    catch (error) {
        console.error('Error creating announcement:', error);
        res.status(400).json({ message: '新增失敗' });
    }
});
// 更新公告
router.patch('/:id', async (req, res) => {
    const { id } = req.params;
    const { title, content, user } = req.body;
    if (!user?.name || !user?.email) {
        return res.status(400).json({ message: '缺少使用者資訊' });
    }
    try {
        const updated = await prisma.bulletin.update({
            where: { id: Number(id) },
            data: {
                title,
                content,
                authorName: user.name,
                authorEmail: user.email,
            },
        });
        res.json(updated);
    }
    catch (error) {
        console.error('Error updating announcement:', error);
        res.status(400).json({ message: '更新失敗' });
    }
});
// 刪除公告
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.bulletin.delete({ where: { id: Number(id) } });
        res.json({ message: '刪除成功' });
    }
    catch (error) {
        console.error('Error deleting announcement:', error);
        res.status(400).json({ message: '刪除失敗' });
    }
});
exports.default = router;
