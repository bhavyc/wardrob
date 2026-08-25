const { PrismaClient } = require('./src/generated/prisma');
const prisma = new PrismaClient();

async function main() {
  await prisma.user.update({
    where: { email: 'priya@wardrob.com' },
    data: {
      failedLoginAttempts: 0,
      lockedUntil: null,
    }
  });
  console.log('Account unlocked!');
}

main().finally(() => prisma.$disconnect());
