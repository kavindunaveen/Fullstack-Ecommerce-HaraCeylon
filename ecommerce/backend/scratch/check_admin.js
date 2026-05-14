const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (admin) {
    console.log('Admin exists:', admin.email);
  } else {
    const firstUser = await prisma.user.findFirst();
    if (firstUser) {
      await prisma.user.update({
        where: { id: firstUser.id },
        data: { role: 'ADMIN' }
      });
      console.log('No admin found. Promoted', firstUser.email, 'to ADMIN');
    } else {
      console.log('No users found in database.');
    }
  }
}

main().finally(() => prisma.$disconnect());
