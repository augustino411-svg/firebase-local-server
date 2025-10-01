"use strict";
// server/index.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
// 讀取環境變數
dotenv_1.default.config({ path: './.env' });
const app = (0, express_1.default)();
// ✅ 中介層設定
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
// ✅ CORS 設定：支援本地與雲端前端
const allowedOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
app.use((0, cors_1.default)({ origin: allowedOrigin, credentials: true }));
// ✅ 路由模組掛載（依功能分群）
// 🔐 使用者驗證
const auth_1 = __importDefault(require("./routes/auth"));
app.use('/api/auth', auth_1.default);
// 👤 使用者管理
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
app.use('/api/user', userRoutes_1.default);
// 👨‍🎓 學生資料
const students_1 = __importDefault(require("./routes/students"));
app.use('/api/students', students_1.default);
// 🕒 出缺勤紀錄
const attendance_1 = __importDefault(require("./routes/attendance"));
app.use('/api/attendance', attendance_1.default);
// 📢 公告系統
const announcements_1 = __importDefault(require("./routes/announcements"));
app.use('/api/announcements', announcements_1.default);
// 🧠 輔導紀錄
const counseling_1 = __importDefault(require("./routes/counseling"));
app.use('/api/counseling', counseling_1.default);
// ⚙️ 系統設定
const settings_1 = __importDefault(require("./routes/settings"));
app.use('/api/settings', settings_1.default);
// 💾 備份與還原
const backup_1 = __importDefault(require("./routes/backup"));
app.use('/api/backup', backup_1.default);
const restore_1 = __importDefault(require("./routes/restore"));
app.use('/api/restore', restore_1.default);
// 🧪 開發測試工具（包含 /seed-user）
const dev_1 = __importDefault(require("./routes/dev"));
app.use('/api/dev', dev_1.default);
// ✅ 啟動伺服器
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`✅ Express server running on http://localhost:${PORT}`);
});
