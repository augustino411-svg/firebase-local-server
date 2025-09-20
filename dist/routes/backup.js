"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
router.get('/', async (req, res) => {
    try {
        const [students, attendance, counseling, bulletins, semesters, users] = await Promise.all([
            prisma.student.findMany(),
            prisma.attendance.findMany(),
            prisma.counseling.findMany(),
            prisma.bulletin.findMany(),
            prisma.semester.findMany(),
            prisma.user.findMany(),
        ]);
        const backup = {
            students,
            attendance,
            counselingRecords: counseling,
            announcements: bulletins,
            semesters,
            users,
            exportedAt: new Date().toISOString(),
        };
        res.json(backup);
    }
    catch (error) {
        console.error('Error generating backup:', error);
        res.status(500).json({ message: '備份失敗' });
    }
});
exports.default = router;
