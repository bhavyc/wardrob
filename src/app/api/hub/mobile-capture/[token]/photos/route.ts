import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { processAndUploadImage } from '@/lib/upload-utils';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token is required' },
        { status: 400 }
      );
    }

    const session = await prisma.mobileCaptureSession.findUnique({
      where: { token },
      include: {
        booking: {
          select: {
            id: true,
            listing: {
              select: {
                title: true,
                sku: true,
              }
            }
          }
        }
      }
    });

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Capture session not found' },
        { status: 404 }
      );
    }

    // Check expiry
    let status = session.status;
    if (status === 'ACTIVE' && new Date() > session.expiresAt) {
      await prisma.mobileCaptureSession.update({
        where: { token },
        data: { status: 'EXPIRED' }
      });
      status = 'EXPIRED';
    }

    return NextResponse.json({
      success: true,
      status,
      photos: session.photos,
      expiresAt: session.expiresAt.toISOString(),
      booking: session.booking
    });
  } catch (error: any) {
    console.error('Error fetching mobile capture photos:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token is required.' },
        { status: 400 }
      );
    }

    const session = await prisma.mobileCaptureSession.findUnique({
      where: { token }
    });

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Capture session not found.' },
        { status: 404 }
      );
    }

    // Check status & expiry
    if (session.status !== 'ACTIVE' || new Date() > session.expiresAt) {
      if (session.status === 'ACTIVE') {
        await prisma.mobileCaptureSession.update({
          where: { token },
          data: { status: 'EXPIRED' }
        });
      }
      return NextResponse.json(
        { success: false, error: `Session is ${session.status === 'COMPLETED' ? 'already completed' : 'expired'}.` },
        { status: 410 }
      );
    }

    // Only multipart/form-data with real image files is accepted.
    // Every uploaded photo is strictly validated via the resolution/blur/duplicate pipeline.
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No image file uploaded.' },
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

    const contextId = `hub_${session.bookingId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
    const result = await processAndUploadImage(buffer, contextId, requestBaseUrl);

    if (!result.success || !result.url) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to process image.' },
        { status: 400 }
      );
    }

    // Append photo URL to the session
    const updatedSession = await prisma.mobileCaptureSession.update({
      where: { token },
      data: {
        photos: {
          push: result.url
        }
      }
    });

    return NextResponse.json({
      success: true,
      url: result.url,
      photos: updatedSession.photos
    });
  } catch (error: any) {
    console.error('Error uploading mobile capture photo:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
