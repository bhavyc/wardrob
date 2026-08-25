import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { bookingId, rating, comment } = await request.json();

    if (!bookingId || !rating) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { listing: { include: { lister: { include: { user: true } } } } }
    });

    if (!booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
    }

    if (booking.status !== 'COMPLETED') {
      return NextResponse.json({ success: false, error: 'You can only review completed bookings' }, { status: 400 });
    }

    const isRenter = booking.renterId === user.userId;
    const isLister = booking.listing.lister.userId === user.userId;

    if (!isRenter && !isLister) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    // Determine reviewee
    const revieweeId = isRenter ? booking.listing.lister.userId : booking.renterId;

    // Check if review already exists
    const existingReview = await prisma.review.findFirst({
      where: {
        bookingId,
        reviewerId: user.userId
      }
    });

    if (existingReview) {
      return NextResponse.json({ success: false, error: 'You have already submitted a review for this booking' }, { status: 400 });
    }

    const review = await prisma.review.create({
      data: {
        rating,
        comment,
        reviewerId: user.userId,
        revieweeId,
        bookingId,
        listingId: isRenter ? booking.listingId : null
      }
    });

    // Update target user's average rating
    const allReviews = await prisma.review.findMany({
      where: { revieweeId }
    });
    const avgRating = allReviews.reduce((acc, r) => acc + r.rating, 0) / allReviews.length;

    await prisma.user.update({
      where: { id: revieweeId },
      data: { rating: avgRating }
    });

    return NextResponse.json({ success: true, message: 'Review submitted successfully', review });

  } catch (error: any) {
    console.error('Review API Error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
