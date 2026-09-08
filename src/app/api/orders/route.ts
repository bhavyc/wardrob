import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function POST() {
  return NextResponse.json(
    { success: false, error: 'Direct order creation without payment gateway verification is disabled. Please use /api/checkout/razorpay/order.' },
    { status: 403 }
  );
}

export async function GET(request: Request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const bookings = await prisma.booking.findMany({
      where: { renterId: authUser.userId },
      include: {
        listing: true,
        shipments: true,
        damageReports: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      orders: bookings,
      bookings,
    });
  } catch (error: any) {
    console.error('API Orders GET Error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error.' }, { status: 500 });
  }
}
