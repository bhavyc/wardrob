import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import bcrypt from 'bcryptjs';

async function main() {
  const email = process.argv[2] || 'inwardrob@gmail.com';
  const password = process.argv[3] || 'admin123';

  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const passwordHash = await bcrypt.hash(password, 10);

    const admin = await prisma.user.upsert({
      where: { email },
      update: {
        role: 'ADMIN',
        passwordHash,
      },
      create: {
        name: 'Admin',
        email,
        phone: '9999999999',
        role: 'ADMIN',
        passwordHash,
      },
    });

    console.log(`\n✅ Success: Admin account is ready!`);
    console.log(`Email: ${admin.email}`);
    console.log(`Role: ${admin.role}`);
    console.log(`Password: ${password}\n`);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Error creating admin:', err);
  process.exit(1);
});
