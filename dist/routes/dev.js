"use strict";
// server/routes/dev.ts
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// 建立測試帳號（不加密密碼）
router.post('/seed-user', async (req, res) => {
    try {
        const email = 'augustino411@gmail.com';
        const existing = await prisma.user.findUnique({
            where: { email },
        });
        if (existing) {
            return res.status(200).json({ message: '帳號已存在', user: existing });
        }
        const user = await prisma.user.create({
            data: {
                name: 'augustino411',
                email,
                passwordHash: '12345678', // ❗ 明文密碼（僅限測試用途）
                role: 'admin',
                assignedClasses: ['ADB1'],
            },
        });
        res.status(201).json({ message: '已新增測試帳號', user });
    }
    catch (error) {
        console.error('建立帳號失敗:', error);
        res.status(500).json({ message: '伺服器錯誤' });
    }
});
exports.default = router;
