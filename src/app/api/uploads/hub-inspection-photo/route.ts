import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { processAndUploadImage } from '@/lib/upload-utils';

export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser(request);

    if (!authUser || authUser.role !== 'HUB_PARTNER') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Hub Partner access required.' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const rawBookingId = formData.get('bookingId') as string;
    const bookingId = rawBookingId ? `hub_${rawBookingId.replace(/[^a-zA-Z0-9_-]/g, '')}` : `hub_${authUser.userId}`;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file uploaded.' },
        { status: 400 }
      );
    }

    const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds the 8MB limit.' },
        { status: 400 }
      );
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Only JPEG, PNG, WEBP, and GIF images are allowed.' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const host = request.headers.get('host') || '127.0.0.1:3000';
    const proto = request.headers.get('x-forwarded-proto') || 'http';
    const requestBaseUrl = `${proto}://${host}`;

    const result = await processAndUploadImage(buffer, bookingId, requestBaseUrl);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Image validated and uploaded successfully.',
      url: result.url,
    });
  } catch (error: any) {
    console.error('API Hub Inspection Photo Upload Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error during upload.' },
      { status: 500 }
    );
  }
}
