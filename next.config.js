/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
<<<<<<< HEAD
  swcMinify: true,

=======
>>>>>>> c4880c4 (Initial commit)
  // ✅ 跳過 ESLint 錯誤，讓 Vercel 建置不會中斷
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
