import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@haraceylon.com';
  const password = 'HaraAdmin123!';

  // Check if admin already exists
  let admin = await prisma.user.findUnique({ where: { email } });

  if (admin) {
    // Elevate to admin if it exists
    admin = await prisma.user.update({
      where: { email },
      data: { role: 'ADMIN', isVerified: true }
    });
    console.log(`User ${email} already existed and was elevated to ADMIN.`);
  } else {
    // Create new admin
    const passwordHash = await bcrypt.hash(password, 10);
    admin = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName: 'Hara',
        lastName: 'Admin',
        role: 'ADMIN',
        isVerified: true
      }
    });
    console.log(`New ADMIN created successfully: ${email}`);
  }

  console.log('---');
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  console.log('---');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
