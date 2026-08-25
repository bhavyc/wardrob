import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { processAndUploadImage } from '@/lib/upload-utils';

export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser(request);

    if (!authUser || authUser.role !== 'LISTER') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Lister access required.' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    // We expect listingId or a similar context identifier to scope duplicates
    const listingId = formData.get('listingId') as string || `lister_${authUser.userId}`;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file uploaded.' },
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

    const result = await processAndUploadImage(buffer, listingId);

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
    console.error('API Listing Photo Upload Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error during upload.' },
      { status: 500 }
    );
  }
}
