import 'dotenv/config';
import { prisma } from '../src/lib/db';

async function main() {
  const res = await prisma.listing.updateMany({
    where: {
      OR: [
        { title: { contains: 'Test' } },
        { title: { contains: 'Debug' } },
        { title: { contains: 'abcd' } },
        { title: { contains: 'QC Test' } },
      ],
    },
    data: {
      status: 'UNLISTED',
    },
  });

  console.log(`Successfully unlisted ${res.count} test listings!`);

  const active = await prisma.listing.findMany({
    where: { status: { in: ['AVAILABLE', 'AT_HUB'] } },
    select: { id: true, title: true, category: true, baselineImages: true, rentalPrice: true },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  console.log('Now active listings in public catalog:');
  active.forEach(a => console.log(`- [${a.category}] ${a.title} (₹${a.rentalPrice}) [images: ${a.baselineImages.length}]`));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
