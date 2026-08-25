import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser(request);

    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { isActive } = await request.json();

    if (isActive === undefined) {
      return NextResponse.json(
        { success: false, error: 'isActive status parameter is required.' },
        { status: 400 }
      );
    }

    const existing = await prisma.coupon.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Coupon code not found.' },
        { status: 404 }
      );
    }

    const updated = await prisma.coupon.update({
      where: { id },
      data: { isActive: Boolean(isActive) },
    });

    return NextResponse.json({
      success: true,
      message: `Coupon has been ${updated.isActive ? 'activated' : 'suspended'} successfully.`,
      coupon: {
        ...updated,
        discountValue: Number(updated.discountValue),
        minOrderValue: updated.minOrderValue ? Number(updated.minOrderValue) : null,
      },
    });
  } catch (error: any) {
    console.error('API Admin Coupons PATCH Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthUser(request);

    if (!authUser || authUser.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const existing = await prisma.coupon.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Coupon code not found.' },
        { status: 404 }
      );
    }

    await prisma.coupon.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Coupon code has been permanently deleted.',
    });
  } catch (error: any) {
    console.error('API Admin Coupons DELETE Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
