import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const authUser = await getAuthUser(request);

    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized.' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.userId },
      select: { cartState: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found.' },
        { status: 404 }
      );
    }

    const cart = user.cartState ? JSON.parse(user.cartState) : [];

    return NextResponse.json({
      success: true,
      cart,
    });
  } catch (error: any) {
    console.error('API Cart GET Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser(request);

    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized.' },
        { status: 401 }
      );
    }

    const { cart } = await request.json();

    if (!cart || !Array.isArray(cart)) {
      return NextResponse.json(
        { success: false, error: 'Invalid cart state.' },
        { status: 400 }
      );
    }

    // Save serialized cart to the user record
    await prisma.user.update({
      where: { id: authUser.userId },
      data: {
        cartState: JSON.stringify(cart),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Cart state synchronized successfully.',
    });
  } catch (error: any) {
    console.error('API Cart POST Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
