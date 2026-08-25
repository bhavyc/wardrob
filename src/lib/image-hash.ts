import crypto from 'crypto';
import { prisma } from '@/lib/db';

/**
 * Computes a SHA-256 hash of the image buffer to prevent exact duplicate uploads.
 * In a production P2P marketplace, this can be upgraded to perceptual hashing (like pHash)
 * using a library like 'jimp' or 'blockhash-core' to detect cropped/resized duplicates.
 */
export function computeImageHash(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Checks if the computed hash already exists in the database.
 * If not, it saves the hash.
 * @param hashValue The computed hash string
 * @returns boolean True if duplicate, False if unique
 */
export async function checkAndStoreDuplicateHash(hashValue: string): Promise<boolean> {
  const existing = await prisma.duplicatePhotoHash.findUnique({
    where: { 
      hashValue_contextId: {
        hashValue,
        contextId: 'legacy-image-hash',
      }
    },
  });

  if (existing) {
    return true; // Duplicate found
  }

  await prisma.duplicatePhotoHash.create({
    data: { 
      hashValue,
      contextId: 'legacy-image-hash',
    },
  });

  return false;
}
