"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
router.post('/seed-user', async (req, res) => {
    try {
        const user = await prisma.user.create({
            data: {
                name: 'augustino411',
                email: 'augustino411@gmail.com',
                role: 'admin',
                assignedClasses: ['ADB1'],
                passwordHash: '12345678',
            },
        });
        res.json({ message: '已新增測試帳號', user });
    }
    catch (error) {
        console.error('Seed error:', error);
        res.status(500).json({ message: '新增失敗' });
    }
});
exports.default = router;
