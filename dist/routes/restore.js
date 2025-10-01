"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
router.post('/', async (req, res) => {
    const backup = req.body;
    if (!backup || typeof backup !== 'object') {
        return res.status(400).json({ success: false, message: '備份資料格式錯誤' });
    }
    try {
        let collectionCount = 0;
        let documentCount = 0;
        if (Array.isArray(backup.students)) {
            await prisma.student.deleteMany();
            await prisma.student.createMany({ data: backup.students });
            collectionCount++;
            documentCount += backup.students.length;
        }
        if (Array.isArray(backup.attendance)) {
            await prisma.attendance.deleteMany();
            await prisma.attendance.createMany({ data: backup.attendance });
            collectionCount++;
            documentCount += backup.attendance.length;
        }
        if (Array.isArray(backup.counselingRecords)) {
            await prisma.counseling.deleteMany();
            await prisma.counseling.createMany({ data: backup.counselingRecords });
            collectionCount++;
            documentCount += backup.counselingRecords.length;
        }
        if (Array.isArray(backup.announcements)) {
            await prisma.bulletin.deleteMany();
            await prisma.bulletin.createMany({ data: backup.announcements });
            collectionCount++;
            documentCount += backup.announcements.length;
        }
        if (Array.isArray(backup.semesters)) {
            await prisma.semester.deleteMany();
            await prisma.semester.createMany({ data: backup.semesters });
            collectionCount++;
            documentCount += backup.semesters.length;
        }
        if (Array.isArray(backup.users)) {
            await prisma.user.deleteMany();
            await prisma.user.createMany({ data: backup.users });
            collectionCount++;
            documentCount += backup.users.length;
        }
        res.json({ success: true, collectionCount, documentCount });
    }
    catch (error) {
        console.error('Restore error:', error);
        res.status(500).json({ success: false, message: '還原失敗' });
    }
});
exports.default = router;
