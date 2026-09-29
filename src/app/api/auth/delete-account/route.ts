import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser(request);

    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please sign in to delete your account.' },
        { status: 401 }
      );
    }

    const userId = authUser.userId;

    // Check user existence
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        listerProfile: {
          include: {
            listings: true,
          }
        },
        renterBookings: {
          where: {
            status: {
              in: [
                'PENDING',
                'CONFIRMED',
                'AT_HUB_PRE',
                'OUT_FOR_DELIVERY',
                'IN_USE',
                'RETURNED_TO_HUB',
              ]
            }
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Account not found.' },
        { status: 404 }
      );
    }

    // 1. Guard: Check if renter has active / in-transit rentals
    if (user.renterBookings.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'You have active rentals or unreturned outfits. Please complete all returns and deposit settlements before deleting your account.'
        },
        { status: 400 }
      );
    }

    // 2. Guard: Check if lister has listings currently rented out
    if (user.listerProfile) {
      const activeListerRentals = user.listerProfile.listings.some(
        l => l.status === 'RENTED' || l.status === 'AT_HUB'
      );
      if (activeListerRentals) {
        return NextResponse.json(
          {
            success: false,
            error: 'You have listed outfits currently in rental or at the hub. Please wait for rental completions before deleting your account.'
          },
          { status: 400 }
        );
      }
    }

    // 3. Clear all active sessions
    await prisma.session.deleteMany({
      where: { userId }
    });

    // 4. Delete notifications, mobile sessions, and unneeded records
    await prisma.notification.deleteMany({ where: { userId } });
    await prisma.mobileCaptureSession.deleteMany({ where: { userId } });
    await prisma.listerMobileCaptureSession.deleteMany({ where: { userId } });

    // 5. Check if user has past historical completed/cancelled bookings
    const historicalBookingsCount = await prisma.booking.count({
      where: { renterId: userId }
    });

    if (historicalBookingsCount === 0 && (!user.listerProfile || user.listerProfile.listings.length === 0)) {
      // Clean delete if no historical bookings/listings exist
      if (user.listerProfile) {
        await prisma.listerProfile.delete({ where: { userId } });
      }
      await prisma.user.delete({ where: { id: userId } });
    } else {
      // Anonymize and erase all PII (GDPR / DPDP compliance while retaining audit ledger)
      const anonymousSuffix = Date.now().toString(36);
      await prisma.user.update({
        where: { id: userId },
        data: {
          name: 'Deleted User',
          email: `deleted_${userId}_${anonymousSuffix}@wardrob.invalid`,
          phone: null,
          passwordHash: null,
          failedLoginAttempts: 0,
          lockedUntil: new Date(0),
          resetToken: null,
          resetTokenExpires: null,
          idVerified: false,
          idVerificationStatus: 'NOT_SUBMITTED',
          idType: null,
          idNumber: null,
          aadhaarNumber: null,
          panNumber: null,
          idPhotoUrl: null,
          idRejectionReason: null,
          cartState: null,
        }
      });

      if (user.listerProfile) {
        await prisma.listerProfile.update({
          where: { userId },
          data: {
            shopName: 'Archived Shop',
            bio: null,
            aadhaarNumber: null,
            panNumber: null,
            bankAccountNo: null,
            bankIfsc: null,
            status: 'REJECTED'
          }
        });
      }
    }

    const response = NextResponse.json({
      success: true,
      message: 'Your account and personal data have been permanently deleted.'
    });

    // Clear auth cookie
    response.cookies.delete('auth_token');

    return response;
  } catch (error: any) {
    console.error('Delete Account Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete account. Please try again or contact concierge.' },
      { status: 500 }
    );
  }
}
