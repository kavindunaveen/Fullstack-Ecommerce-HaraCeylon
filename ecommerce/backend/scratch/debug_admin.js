const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({ where: { email: 'admin@haraceylon.com' } });
  if (user) {
    console.log('User found:');
    console.log('ID:', user.id);
    console.log('Email:', user.email);
    console.log('Role:', user.role);
    console.log('Has Password Hash:', !!user.passwordHash);
  } else {
    console.log('User not found.');
  }
}

main().finally(() => prisma.$disconnect());
