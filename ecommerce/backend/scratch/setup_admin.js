const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const email = 'admin@haraceylon.com';
  const password = 'admin123';
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: 'ADMIN' },
    create: { 
      email, 
      passwordHash, 
      role: 'ADMIN',
      firstName: 'Store',
      lastName: 'Admin'
    }
  });

  console.log('Admin account set up successfully.');
  console.log('Email:', email);
  console.log('Password: admin123');
}

main().finally(() => prisma.$disconnect());
