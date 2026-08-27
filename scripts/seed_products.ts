import { prisma } from '../src/lib/db';

async function seedProducts() {
  console.log('🌱 Starting database seed with luxury fashion products...');

  try {
    // Check if we have a lister to own these products
    let lister = await prisma.listerProfile.findFirst({
      where: { status: 'APPROVED' },
    });

    if (!lister) {
      console.log('No approved lister found, creating a master lister...');
      const user = await prisma.user.create({
        data: {
          name: 'Boutique Wardrob',
          email: 'boutique@wardrob.in',
          phone: '9999999999',
          role: 'LISTER',
        },
      });

      lister = await prisma.listerProfile.create({
        data: {
          userId: user.id,
          shopName: 'Wardrob Exclusives',
          status: 'APPROVED',
          registrationFeePaid: true,
          referralCode: 'WARDROB_EXCLUSIVE',
        },
      });
    }

    const listerId = lister.id;

    const products = [
      {
        title: 'Sabyasachi Heritage Bridal Lehenga',
        description: 'Iconic red silk bridal lehenga with intricate zardosi embroidery and a heavy matching dupatta. Perfect for your big day.',
        category: 'Lehenga',
        size: 'M',
        condition: 'LIKE_NEW',
        rentalPrice: 8500,
        securityDeposit: 3000,
        baselineImages: ['https://images.unsplash.com/photo-1583391733958-d259728fca8c?auto=format&fit=crop&q=80&w=800'],
      },
      {
        title: 'Manish Malhotra Sequin Saree',
        description: 'Dazzling rose-gold sequin saree that catches the light beautifully. Paired with a velvet blouse.',
        category: 'Saree',
        size: 'FREE_SIZE',
        condition: 'EXCELLENT',
        rentalPrice: 4200,
        securityDeposit: 1500,
        baselineImages: ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800'],
      },
      {
        title: 'Tarun Tahiliani Ivory Gown',
        description: 'Exquisite ivory reception gown featuring Swarovski crystals and sheer paneling. An absolute showstopper.',
        category: 'Gown',
        size: 'S',
        condition: 'LIKE_NEW',
        rentalPrice: 6500,
        securityDeposit: 2500,
        baselineImages: ['https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=800'],
      },
      {
        title: 'Anita Dongre Gotapatti Anarkali',
        description: 'Signature powder blue Anarkali suit featuring delicate silver Gota Patti work. Perfect for haldi or mehendi.',
        category: 'Anarkali',
        size: 'L',
        condition: 'EXCELLENT',
        rentalPrice: 3500,
        securityDeposit: 1200,
        baselineImages: ['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=800'],
      },
      {
        title: 'Rahul Mishra Hand-Embroidered Kurta Set',
        description: 'Elegant ivory kurta set with 3D floral hand embroidery and matching organza dupatta.',
        category: 'Kurta Set',
        size: 'M',
        condition: 'LIKE_NEW',
        rentalPrice: 2800,
        securityDeposit: 1000,
        baselineImages: ['https://images.unsplash.com/photo-1592305553535-714ccbd8b15d?auto=format&fit=crop&q=80&w=800'],
      },
      {
        title: 'Falguni Shane Peacock Feather Gown',
        description: 'Dramatic black and silver reception gown with signature feather detailing on the hem.',
        category: 'Gown',
        size: 'M',
        condition: 'GOOD',
        rentalPrice: 7000,
        securityDeposit: 2500,
        baselineImages: ['https://images.unsplash.com/photo-1566207455823-74cf8f20b411?auto=format&fit=crop&q=80&w=800'],
      },
      {
        title: 'Abu Jani Sandeep Khosla Chikankari Saree',
        description: 'Classic white Chikankari saree woven on premium georgette. A timeless piece of luxury.',
        category: 'Saree',
        size: 'FREE_SIZE',
        condition: 'EXCELLENT',
        rentalPrice: 4500,
        securityDeposit: 1800,
        baselineImages: ['https://images.unsplash.com/photo-1614050868884-1d6ebfa77da1?auto=format&fit=crop&q=80&w=800'],
      },
      {
        title: 'Raw Mango Silk Brocade Sharara',
        description: 'Vibrant emerald green silk sharara set with gold zari weaving. Traditional yet modern.',
        category: 'Sharara',
        size: 'XL',
        condition: 'LIKE_NEW',
        rentalPrice: 3200,
        securityDeposit: 1200,
        baselineImages: ['https://images.unsplash.com/photo-1610427845353-9fbd2f036577?auto=format&fit=crop&q=80&w=800'],
      },
      {
        title: 'Ritu Kumar Velvet Lehenga',
        description: 'Deep maroon velvet lehenga tailored for winter weddings. Intricate dabka and resham work.',
        category: 'Lehenga',
        size: 'M',
        condition: 'EXCELLENT',
        rentalPrice: 5500,
        securityDeposit: 2000,
        baselineImages: ['https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=800'], // Reusing some good URLs
      },
      {
        title: 'Gaurav Gupta Sculpted Concept Saree',
        description: 'Midnight blue concept pre-draped saree with signature GG sculpted ruffles and structured blouse.',
        category: 'Saree',
        size: 'S',
        condition: 'LIKE_NEW',
        rentalPrice: 6000,
        securityDeposit: 2200,
        baselineImages: ['https://images.unsplash.com/photo-1583391733958-d259728fca8c?auto=format&fit=crop&q=80&w=800'],
      }
    ];

    let count = 0;
    for (const p of products) {
      await prisma.listing.create({
        data: {
          listerProfileId: listerId,
          title: p.title,
          description: p.description,
          category: p.category,
          size: p.size,
          condition: p.condition,
          rentalPrice: p.rentalPrice,
          securityDeposit: p.securityDeposit,
          baselineImages: p.baselineImages,
          status: 'AVAILABLE',
          isFeatured: count < 4 // Make first 4 featured
        }
      });
      count++;
    }

    console.log(`✅ Successfully seeded ${count} luxury fashion products into the database!`);
    
  } catch (error) {
    console.error('❌ Error seeding products:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedProducts();
