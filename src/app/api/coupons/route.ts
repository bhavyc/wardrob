import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const coupons = await prisma.coupon.findMany({
      where: {
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      orderBy: { code: 'asc' },
    });

    return NextResponse.json({
      success: true,
      coupons,
    });
  } catch (error: any) {
    console.error('API Coupons GET Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { code, orderValue } = await request.json();

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Coupon code is required.' },
        { status: 400 }
      );
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.trim().toUpperCase() },
    });

    // Check existence & activity
    if (!coupon || !coupon.isActive) {
      return NextResponse.json(
        { success: false, error: 'Invalid or inactive coupon code.' },
        { status: 400 }
      );
    }

    // Check expiration
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Coupon code has expired.' },
        { status: 400 }
      );
    }

    // Check minimum order value constraints
    if (coupon.minOrderValue && orderValue !== undefined && Number(orderValue) < Number(coupon.minOrderValue)) {
      return NextResponse.json(
        {
          success: false,
          error: `Minimum order value of ₹${Number(coupon.minOrderValue).toLocaleString('en-IN')} required for this coupon.`,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Coupon applied successfully.',
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: Number(coupon.discountValue),
      },
    });
  } catch (error: any) {
    console.error('API Coupons POST Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
