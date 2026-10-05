import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    // Basic Admin Check
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('admin_session')?.value;
    
    if (!sessionId) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { user: true }
    });

    if (!session || session.user.role !== 'ADMIN') {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Create a Dummy Lister User if not exists
    let dummyUser = await prisma.user.findUnique({ where: { email: 'dummy.lister@wardrob.com' } });
    if (!dummyUser) {
      const hashedPassword = await bcrypt.hash('wardrob123', 10);
      dummyUser = await prisma.user.create({
        data: {
          email: 'dummy.lister@wardrob.com',
          passwordHash: hashedPassword,
          fullName: 'Boutique Atelier',
          phoneNumber: '+919999999999',
          role: 'LISTER',
          isEmailVerified: true,
          isPhoneVerified: true,
        }
      });
    }

    // 2. Add Dummy Products
    const dummyProducts = [
      {
        title: "Sabyasachi Heritage Bridal Lehenga",
        description: "An authentic Sabyasachi bridal lehenga featuring intricate zardosi work and a signature Bengal tiger motif belt. Perfect for your special day.",
        retailPrice: 450000,
        rentalPrice: 35000,
        securityDeposit: 15000,
        size: "M",
        color: "Deep Red",
        category: "Bridal Wear",
        condition: "EXCELLENT",
        photos: [
            "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=800",
            "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800"
        ]
      },
      {
        title: "Manish Malhotra Sequined Saree",
        description: "Signature Manish Malhotra ombre sequin saree in champagne gold and blush pink. Paired with a contemporary halter neck blouse.",
        retailPrice: 125000,
        rentalPrice: 12000,
        securityDeposit: 5000,
        size: "Free Size",
        color: "Champagne Gold",
        category: "Party Wear",
        condition: "LIKE_NEW",
        photos: [
            "https://images.unsplash.com/photo-1610116306796-6fea9f4fae38?auto=format&fit=crop&q=80&w=800",
            "https://images.unsplash.com/photo-1609505848912-b7c3b8b4beda?auto=format&fit=crop&q=80&w=800"
        ]
      },
      {
        title: "Anita Dongre Gota Patti Kurta Set",
        description: "Elegant mint green kurta set with exquisite silver gota patti embroidery. Includes matching palazzo pants and a sheer dupatta.",
        retailPrice: 85000,
        rentalPrice: 8000,
        securityDeposit: 3000,
        size: "S",
        color: "Mint Green",
        category: "Festive Wear",
        condition: "GOOD",
        photos: [
            "https://images.unsplash.com/photo-1583391733958-6c782781b955?auto=format&fit=crop&q=80&w=800",
            "https://images.unsplash.com/photo-1597983073493-88cd35cf93b0?auto=format&fit=crop&q=80&w=800"
        ]
      },
      {
        title: "Tarun Tahiliani Concept Saree",
        description: "Pre-draped concept saree in ivory with delicate pearl and Swarovski crystal embellishments. Effortless luxury.",
        retailPrice: 180000,
        rentalPrice: 18000,
        securityDeposit: 8000,
        size: "M",
        color: "Ivory",
        category: "Evening Gowns",
        condition: "EXCELLENT",
        photos: [
            "https://images.unsplash.com/photo-1593030761757-71fae46af508?auto=format&fit=crop&q=80&w=800",
            "https://images.unsplash.com/photo-1594938298596-eb5fd5e53377?auto=format&fit=crop&q=80&w=800"
        ]
      }
    ];

    let createdCount = 0;

    for (const product of dummyProducts) {
      // Check if product already exists
      const existing = await prisma.product.findFirst({
        where: { title: product.title }
      });

      if (!existing) {
        await prisma.product.create({
          data: {
            title: product.title,
            description: product.description,
            retailPrice: product.retailPrice,
            rentalPrice: product.rentalPrice,
            securityDeposit: product.securityDeposit,
            size: product.size,
            color: product.color,
            category: product.category,
            condition: product.condition as any,
            status: 'APPROVED',
            photos: product.photos,
            listerId: dummyUser.id,
            brand: "Designer",
            location: "Mumbai",
          }
        });
        createdCount++;
      }
    }

    return NextResponse.json({ success: true, message: `Successfully seeded ${createdCount} dummy products.`, count: createdCount });

  } catch (error) {
    console.error('Error seeding data:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
