"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// 查詢所有輔導紀錄
router.get('/', async (req, res) => {
    try {
        const records = await prisma.counseling.findMany({
            orderBy: { date: 'desc' },
        });
        res.json(records);
    }
    catch (error) {
        console.error('Error fetching counseling records:', error);
        res.status(500).json({ message: '查詢失敗' });
    }
});
// 查詢某日某學生某類型的紀錄數量
router.get('/count', async (req, res) => {
    const { datePrefix, studentId, typePrefix } = req.query;
    if (typeof datePrefix !== 'string' ||
        typeof studentId !== 'string' ||
        typeof typePrefix !== 'string') {
        return res.status(400).json({ count: 0, message: '查詢參數格式錯誤' });
    }
    try {
        const count = await prisma.counseling.count({
            where: {
                studentId,
                counselingType: { startsWith: typePrefix },
                date: {
                    gte: new Date(`${datePrefix}T00:00:00`),
                    lt: new Date(`${datePrefix}T23:59:59`),
                },
            },
        });
        res.json({ count });
    }
    catch (error) {
        console.error('Error counting counseling records:', error);
        res.status(500).json({ count: 0 });
    }
});
// 新增輔導紀錄（docId 可作為 client 端識別用，不影響 DB）
router.post('/:docId', async (req, res) => {
    const recordData = req.body;
    if (!recordData || typeof recordData !== 'object' || !recordData.date) {
        return res.status(400).json({ message: '資料格式錯誤' });
    }
    try {
        const created = await prisma.counseling.create({
            data: {
                ...recordData,
                date: new Date(recordData.date),
            },
        });
        res.status(201).json(created);
    }
    catch (error) {
        console.error('Error creating counseling record:', error);
        res.status(400).json({ message: '新增失敗' });
    }
});
// 刪除輔導紀錄
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.counseling.delete({ where: { id: Number(id) } });
        res.json({ message: '刪除成功' });
    }
    catch (error) {
        console.error('Error deleting counseling record:', error);
        res.status(400).json({ message: '刪除失敗' });
    }
});
exports.default = router;
