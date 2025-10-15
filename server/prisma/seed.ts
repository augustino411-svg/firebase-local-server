import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.create({
    data: {
      name: '許宏再',
      email: '03210@cyvs.tyc.edu.tw',
      role: 'admin',
      assignedClasses: [],
      passwordHash: '12345678', // 暫時使用明文，方便登入測試
    },
  })

  console.log('✅ 使用者已建立:', user)
}

main()
  .catch((e) => {
    console.error('❌ 建立失敗:', e)
    process.exit(1)
  })
  .finally(() => {
    prisma.$disconnect()
  })