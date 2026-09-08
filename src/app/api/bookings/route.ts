import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { success: false, error: 'Legacy bookings route is disabled. Please use /api/checkout/razorpay/order for booking reservations.' },
    { status: 403 }
  );
}
