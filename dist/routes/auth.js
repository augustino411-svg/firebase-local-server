"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;
// 登入
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    console.log('登入請求:', { email, password });
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
        // ✅ 保留 id 為 number，避免後續型別錯誤
        const tokenPayload = { uid: user.id, role: user.role };
        const token = jsonwebtoken_1.default.sign(tokenPayload, JWT_SECRET, {
            expiresIn: '7d',
        });
        res.cookie('token', token, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        const { passwordHash, ...safeUser } = user;
        res.json(safeUser);
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: '登入失敗' });
    }
});
// 登出
router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: '已登出' });
});
// 取得目前使用者
router.get('/me', async (req, res) => {
    const token = req.cookies?.token;
    if (!token)
        return res.status(401).json({ user: null });
    try {
        // ✅ uid 為 number，避免 Prisma 型別錯誤
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        const user = await prisma.user.findUnique({
            where: { id: decoded.uid },
        });
        if (!user)
            return res.status(404).json({ user: null });
        const { passwordHash, ...safeUser } = user;
        res.json({ user: safeUser });
    }
    catch (error) {
        console.error('Token verification error:', error);
        res.status(401).json({ user: null });
    }
});
exports.default = router;
