import 'dotenv/config';
import { prisma } from '../src/lib/db';

async function main() {
  const allListings = await prisma.listing.findMany();
  let updatedCount = 0;

  for (const l of allListings) {
    let changed = false;
    const newImages = (l.baselineImages || []).map(img => {
      if (img.includes('3731257') || img.includes('example.com') || img.includes('test.jpg')) {
        changed = true;
        return 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=900';
      }
      return img;
    });

    if (changed) {
      await prisma.listing.update({
        where: { id: l.id },
        data: { baselineImages: newImages }
      });
      updatedCount++;
    }
  }

  console.log(`Updated ${updatedCount} listings with clean working image URLs.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
