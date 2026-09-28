import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { processAndUploadImage } from '@/lib/upload-utils';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const session = await prisma.listerMobileCaptureSession.findUnique({
      where: { token }
    });

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session not found.' },
        { status: 404 }
      );
    }

    if (new Date() > session.expiresAt && session.status === 'ACTIVE') {
      await prisma.listerMobileCaptureSession.update({
        where: { id: session.id },
        data: { status: 'EXPIRED' }
      });
      return NextResponse.json(
        { success: false, error: 'Session expired.' },
        { status: 410 }
      );
    }

    return NextResponse.json({
      success: true,
      photos: session.photos,
      status: session.status
    });
  } catch (error: any) {
    console.error('Error fetching lister mobile capture photos:', error);
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
    const session = await prisma.listerMobileCaptureSession.findUnique({
      where: { token }
    });

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session not found.' },
        { status: 404 }
      );
    }

    if (session.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, error: `Session is ${session.status.toLowerCase()}. Cannot add photos.` },
        { status: 400 }
      );
    }

    if (new Date() > session.expiresAt) {
      await prisma.listerMobileCaptureSession.update({
        where: { id: session.id },
        data: { status: 'EXPIRED' }
      });
      return NextResponse.json(
        { success: false, error: 'Session has expired.' },
        { status: 410 }
      );
    }

    let finalPhotoUrl = '';
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      if (!file) {
        return NextResponse.json(
          { success: false, error: 'No file uploaded.' },
          { status: 400 }
        );
      }
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const host = request.headers.get('host') || '127.0.0.1:3000';
      const proto = request.headers.get('x-forwarded-proto') || 'http';
      const requestBaseUrl = `${proto}://${host}`;
      const contextId = `lister_mobile_${session.userId}`;
      const result = await processAndUploadImage(buffer, contextId, requestBaseUrl);
      if (!result.success || !result.url) {
        return NextResponse.json(
          { success: false, error: result.error || 'Failed to process image.' },
          { status: 400 }
        );
      }
      finalPhotoUrl = result.url;
    } else {
      const body = await request.json().catch(() => ({}));
      const { photoUrl } = body;
      if (!photoUrl || typeof photoUrl !== 'string') {
        return NextResponse.json(
          { success: false, error: 'Valid photoUrl is required.' },
          { status: 400 }
        );
      }

      const trimmedUrl = photoUrl.trim();
      // Ensure the URL is either a trusted relative upload path or a valid HTTPS image URL
      const isRelativeUpload = /^\/uploads\/[a-zA-Z0-9_.-]+\.(jpg|jpeg|png|webp|gif)$/i.test(trimmedUrl);
      const isHttpsUrl = /^https:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\/[a-zA-Z0-9/_.-]+\.(jpg|jpeg|png|webp|gif)$/i.test(trimmedUrl);

      if (!isRelativeUpload && !isHttpsUrl) {
        return NextResponse.json(
          { success: false, error: 'Invalid photo URL format. Only secure image links (.jpg, .png, .webp) or internal upload paths are permitted.' },
          { status: 400 }
        );
      }

      finalPhotoUrl = trimmedUrl;
    }

    const updated = await prisma.listerMobileCaptureSession.update({
      where: { token },
      data: {
        photos: {
          push: finalPhotoUrl
        }
      }
    });

    return NextResponse.json({
      success: true,
      photos: updated.photos,
      url: finalPhotoUrl
    });
  } catch (error: any) {
    console.error('Error uploading photo to lister mobile capture session:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
