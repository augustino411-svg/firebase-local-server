const express = require("express");
const next = require("next");
const path = require("path");
const authRoutes = require("./routes/auth"); // ✅ 引入模組

const port = process.env.PORT || 3000;
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();

  server.use(express.json()); // ✅ 放最前面

  // ✅ 掛載 Auth 路由模組
  server.use("/api/auth", authRoutes);

  // ✅ Hello 測試
  server.get("/api/hello", (req, res) => {
    res.json({ message: "Hello from Express API!" });
  });

  // ✅ 靜態檔案
  server.use("/public", express.static(path.join(__dirname, "public")));

  // ✅ 所有其他請求交給 Next.js 處理
  server.all(/.*/, (req, res) => {
    return handle(req, res);
  });

  server.listen(port, () => {
    console.log(`✅ Server running at http://localhost:${port}`);
  });
});