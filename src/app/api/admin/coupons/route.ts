import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const authUser = await getAuthUser(request);

    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      coupons: coupons.map((c) => ({
        ...c,
        discountValue: Number(c.discountValue),
        minOrderValue: c.minOrderValue ? Number(c.minOrderValue) : null,
      })),
    });
  } catch (error: any) {
    console.error('API Admin Coupons GET Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser(request);

    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    const { code, discountType, discountValue, minOrderValue, expiresAt } = await request.json();

    if (!code || !code.trim()) {
      return NextResponse.json(
        { success: false, error: 'Coupon code is required.' },
        { status: 400 }
      );
    }

    const cleanCode = code.trim().toUpperCase();

    if (!discountType || !['PERCENTAGE', 'FLAT'].includes(discountType)) {
      return NextResponse.json(
        { success: false, error: 'Discount type must be PERCENTAGE or FLAT.' },
        { status: 400 }
      );
    }

    const val = Number(discountValue);
    if (isNaN(val) || val <= 0) {
      return NextResponse.json(
        { success: false, error: 'Discount value must be a positive number.' },
        { status: 400 }
      );
    }

    if (discountType === 'PERCENTAGE' && val > 100) {
      return NextResponse.json(
        { success: false, error: 'Percentage discount cannot exceed 100%.' },
        { status: 400 }
      );
    }

    // Check uniqueness
    const existing = await prisma.coupon.findUnique({
      where: { code: cleanCode },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Coupon code already exists.' },
        { status: 400 }
      );
    }

    const minVal = minOrderValue ? Number(minOrderValue) : null;
    if (minVal !== null && (isNaN(minVal) || minVal < 0)) {
      return NextResponse.json(
        { success: false, error: 'Minimum order value must be a non-negative number.' },
        { status: 400 }
      );
    }

    const expiryDate = expiresAt ? new Date(expiresAt) : null;
    if (expiryDate && isNaN(expiryDate.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Invalid expiry date format.' },
        { status: 400 }
      );
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: cleanCode,
        discountType,
        discountValue: val,
        minOrderValue: minVal,
        expiresAt: expiryDate,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Coupon code created successfully.',
      coupon: {
        ...coupon,
        discountValue: Number(coupon.discountValue),
        minOrderValue: coupon.minOrderValue ? Number(coupon.minOrderValue) : null,
      },
    });
  } catch (error: any) {
    console.error('API Admin Coupons POST Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
