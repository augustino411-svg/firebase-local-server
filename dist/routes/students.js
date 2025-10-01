"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// 查詢所有學生
router.get('/', async (req, res) => {
    try {
        const students = await prisma.student.findMany();
        res.json(students);
    }
    catch (err) {
        res.status(500).json({ error: '查詢失敗', detail: err });
    }
});
// 查詢單一學生
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const student = await prisma.student.findUnique({ where: { studentId: id } });
        if (!student)
            return res.status(404).json({ message: '學生不存在' });
        res.json(student);
    }
    catch (err) {
        res.status(500).json({ error: '查詢失敗', detail: err });
    }
});
// 新增學生（由前端提供 studentId）
router.post('/', async (req, res) => {
    const { studentId, name, email } = req.body;
    if (!studentId || !name) {
        return res.status(400).json({ error: 'studentId 與 name 為必填欄位' });
    }
    try {
        const student = await prisma.student.create({
            data: { studentId, name, email },
        });
        res.status(201).json(student);
    }
    catch (err) {
        res.status(400).json({ error: '新增失敗', detail: err });
    }
});
// 匯入學生資料（add 或 overwrite 模式）
router.post('/import', async (req, res) => {
    const { studentsToImport, mode } = req.body;
    if (!Array.isArray(studentsToImport)) {
        return res.status(400).json({ success: false, message: '匯入資料格式錯誤', count: 0 });
    }
    try {
        if (mode === 'overwrite') {
            await prisma.student.deleteMany();
        }
        let count = 0;
        for (const student of studentsToImport) {
            if (student.studentId) {
                await prisma.student.upsert({
                    where: { studentId: student.studentId },
                    update: student,
                    create: student,
                });
                count++;
            }
        }
        res.json({ success: true, message: '學生資料已成功匯入。', count });
    }
    catch (error) {
        console.error('Error importing students:', error);
        res.status(500).json({ success: false, message: '匯入失敗', count: 0 });
    }
});
// 批次刪除學生
router.post('/delete', async (req, res) => {
    const { studentDocIds } = req.body;
    if (!Array.isArray(studentDocIds)) {
        return res.status(400).json({ success: false, message: '刪除資料格式錯誤', count: 0 });
    }
    try {
        await prisma.student.deleteMany({
            where: { studentId: { in: studentDocIds } },
        });
        res.json({
            success: true,
            message: `成功刪除 ${studentDocIds.length} 位學生。`,
            count: studentDocIds.length,
        });
    }
    catch (error) {
        console.error('Error deleting students:', error);
        res.status(500).json({ success: false, message: '刪除失敗', count: 0 });
    }
});
exports.default = router;
