import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

interface GlobalPrismaHolder {
  prisma?: PrismaClient;
  schemaVersion?: number;
}
const globalForPrisma = global as unknown as GlobalPrismaHolder;

let prismaClient: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  prismaClient = new PrismaClient({ adapter });
} else {
  // Version 3 forces recreation of singleton when shippingAddress was added to schema
  if (!globalForPrisma.prisma || globalForPrisma.schemaVersion !== 3) {
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    globalForPrisma.prisma = new PrismaClient({ adapter });
    globalForPrisma.schemaVersion = 3;
  }
  prismaClient = globalForPrisma.prisma;
}

export const prisma = prismaClient;
export * from '../generated/prisma/enums'; // Expose database Enums globally
