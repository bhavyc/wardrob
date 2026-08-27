import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const listings = await prisma.listing.findMany({
    where: {
      rentalPrice: { lt: 5000 }
    },
    select: {
      id: true,
      title: true,
      rentalPrice: true
    }
  });

  console.log(`Found ${listings.length} listings with rentalPrice < 5000:`);
  console.table(listings);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
