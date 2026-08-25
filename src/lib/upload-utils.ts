import sharp from 'sharp';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { prisma } from '@/lib/db';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'mock_access_key',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'mock_secret_key',
  },
});

export async function processAndUploadImage(
  buffer: Buffer,
  contextId: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // 1. File size check (50KB to 8MB)
    if (buffer.length < 50 * 1024) {
      return { success: false, error: 'File is too small (under 50KB). Please use a high-quality original photo.' };
    }
    if (buffer.length > 8 * 1024 * 1024) {
      return { success: false, error: 'File is too large. Maximum size is 8MB.' };
    }

    const image = sharp(buffer);
    const metadata = await image.metadata();

    // 2. Minimum resolution check (1080px on the shortest edge)
    const minSide = Math.min(metadata.width || 0, metadata.height || 0);
    if (minSide < 1080) {
      return { success: false, error: 'Resolution too low. Image must be at least 1080px on the shortest side.' };
    }

    // 3. Blur detection using a Laplacian variance proxy
    const { data: rawData } = await image
      .clone()
      .resize(400) // resize for faster processing
      .grayscale()
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    let sum = 0;
    for (let i = 0; i < rawData.length; i++) {
      sum += rawData[i];
    }
    const mean = sum / rawData.length;
    let variance = 0;
    for (let i = 0; i < rawData.length; i++) {
      variance += Math.pow(rawData[i] - mean, 2);
    }
    variance = variance / rawData.length;

    // A low variance indicates a lack of contrast/edges, commonly meaning blur
    if (variance < 200) { 
      return { success: false, error: 'Photo is too blurry, please retake.' };
    }

    // 4. Perceptual Hash (dHash) for duplicate detection
    const dHashBuffer = await image
      .clone()
      .resize(9, 8, { fit: 'fill' })
      .grayscale()
      .raw()
      .toBuffer();
    
    let hash = '';
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const left = dHashBuffer[row * 9 + col];
        const right = dHashBuffer[row * 9 + col + 1];
        hash += left > right ? '1' : '0';
      }
    }
    const hexHash = BigInt('0b' + hash).toString(16).padStart(16, '0');

    // 5. Check duplicate
    const existingHash = await prisma.duplicatePhotoHash.findUnique({
      where: {
        hashValue_contextId: {
          hashValue: hexHash,
          contextId: contextId,
        }
      }
    });

    if (existingHash) {
      return { success: false, error: 'This photo has already been used, please take a new one.' };
    }

    // 6. Resize and Compress
    const processedBuffer = await image
      .resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();

    // 7. Upload to AWS S3 / Lightsail
    const bucketName = process.env.AWS_BUCKET_NAME || 'wardrob-uploads';
    const filename = `${contextId}/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;

    await s3Client.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: filename,
      Body: processedBuffer,
      ContentType: 'image/jpeg',
    }));

    const url = `https://${bucketName}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${filename}`;

    // 8. Store hash
    await prisma.duplicatePhotoHash.create({
      data: {
        hashValue: hexHash,
        contextId: contextId,
      }
    });

    return { success: true, url };
  } catch (error) {
    console.error('Image processing/upload error:', error);
    return { success: false, error: 'Failed to process and upload image.' };
  }
}
