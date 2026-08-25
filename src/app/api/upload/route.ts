import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { prisma } from '@/lib/db';

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

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file uploaded.' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Only JPEG, PNG, WEBP, and GIF images are allowed.' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Validate magic bytes to ensure it's a genuine image
    if (buffer.length < 12) {
      return NextResponse.json(
        { success: false, error: 'Invalid file.' },
        { status: 400 }
      );
    }

    const hexBytes = buffer.toString('hex', 0, 4).toUpperCase();
    let isGenuineImage = false;
    
    if (hexBytes.startsWith('FFD8FF')) { // JPEG
      isGenuineImage = true;
    } else if (hexBytes === '89504E47') { // PNG
      isGenuineImage = true;
    } else if (hexBytes.startsWith('47494638')) { // GIF
      isGenuineImage = true;
    } else if (hexBytes === '52494646') { // WEBP (RIFF...WEBP)
      const webpCheck = buffer.toString('ascii', 8, 12);
      if (webpCheck === 'WEBP') {
        isGenuineImage = true;
      }
    }

    if (!isGenuineImage) {
      return NextResponse.json(
        { success: false, error: 'Uploaded file is not a genuine image.' },
        { status: 400 }
      );
    }

    // Calculate SHA-256 hash of the file
    const hashSum = crypto.createHash('sha256');
    hashSum.update(buffer);
    const hexHash = hashSum.digest('hex');

    // Check if hash exists
    const existingHash = await prisma.duplicatePhotoHash.findUnique({
      where: {
        hashValue_contextId: {
          hashValue: hexHash,
          contextId: 'legacy-upload',
        }
      }
    });

    if (existingHash) {
      return NextResponse.json(
        { success: false, error: 'Duplicate photo detected. Please take a fresh live photo.' },
        { status: 400 }
      );
    }

    // Save hash to prevent future re-use
    await prisma.duplicatePhotoHash.create({
      data: {
        hashValue: hexHash,
        contextId: 'legacy-upload',
      }
    });

    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(uploadDir, { recursive: true });

    // Generate unique filename and enforce secure extensions to prevent RCE/XSS
    const ext = file.type === 'image/jpeg' ? '.jpg' :
                file.type === 'image/png' ? '.png' :
                file.type === 'image/webp' ? '.webp' :
                file.type === 'image/gif' ? '.gif' : '.jpg';

    const safeFilename = `${Date.now()}_${crypto.randomBytes(8).toString('hex')}${ext}`;
    const filePath = path.join(uploadDir, safeFilename);

    // Save file to public/uploads
    await fs.writeFile(filePath, buffer);

    // Return the relative URL of the saved image
    return NextResponse.json({
      success: true,
      message: 'Image uploaded successfully.',
      url: `/uploads/${safeFilename}`,
    });
  } catch (error: any) {
    console.error('API Upload POST Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error during upload.' },
      { status: 500 }
    );
  }
}
