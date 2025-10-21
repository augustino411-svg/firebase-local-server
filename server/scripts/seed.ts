import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.user.create({
    data: {
      email: 'augustino411@gmail.com',
      passwordHash: '12345678',
      role: 'admin',
      name: 'admin',
      assignedClasses: [],
    },
  });
  console.log('✅ 測試使用者已建立');
}

main()
  .catch((e) => {
    console.error('❌ 建立失敗:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());