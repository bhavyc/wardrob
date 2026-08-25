import 'dotenv/config';
import { prisma } from '../src/lib/db';

async function main() {
  await prisma.user.update({
    where: { email: 'priya@wardrob.com' },
    data: {
      failedLoginAttempts: 0,
      lockedUntil: null,
    }
  });
  console.log('Account unlocked successfully!');
}

main().finally(() => prisma.$disconnect());
