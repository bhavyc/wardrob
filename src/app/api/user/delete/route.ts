import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser(request);

    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized.' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.userId }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found.' },
        { status: 404 }
      );
    }

    // Require password re-verification for password-based accounts
    if (user.passwordHash) {
      const body = await request.json().catch(() => ({}));
      const { password } = body;
      if (!password) {
        return NextResponse.json(
          { success: false, error: 'Password confirmation is required to delete your account.' },
          { status: 400 }
        );
      }
      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return NextResponse.json(
          { success: false, error: 'Incorrect password.' },
          { status: 403 }
        );
      }
    }

    // Prevent deletion if user has active rentals/bookings
    const activeBookings = await prisma.booking.count({
      where: {
        renterId: authUser.userId,
        status: { in: ['CONFIRMED', 'AT_HUB_PRE', 'OUT_FOR_DELIVERY', 'IN_USE', 'RETURNED_TO_HUB'] }
      }
    });

    if (activeBookings > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete account with active or ongoing rentals. Please complete or return your active orders first.' },
        { status: 400 }
      );
    }

    // Prevent deletion if user is a Lister with active listings, items at hub, or pending payouts
    const listerProfile = await prisma.listerProfile.findUnique({
      where: { userId: authUser.userId },
      include: {
        listings: {
          where: {
            status: { in: ['RENTED', 'AT_HUB'] }
          }
        },
        payouts: {
          where: { status: 'PENDING' }
        }
      }
    });

    if (listerProfile) {
      if (listerProfile.listings.length > 0) {
        return NextResponse.json(
          { success: false, error: 'Cannot delete account with items currently rented or stored at the Hub. Please withdraw your items first.' },
          { status: 400 }
        );
      }
      if (listerProfile.payouts.length > 0) {
        return NextResponse.json(
          { success: false, error: 'Cannot delete account with pending financial payouts awaiting settlement.' },
          { status: 400 }
        );
      }
    }

    // Delete the user from the database
    await prisma.user.delete({
      where: { id: authUser.userId },
    });

    const response = NextResponse.json({
      success: true,
      message: 'Account deleted successfully.',
    });

    // Clear session cookie
    response.cookies.delete('auth_token');

    return response;
  } catch (error: any) {
    console.error('API User Delete Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
