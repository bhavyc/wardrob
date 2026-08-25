import crypto from 'crypto';

if (!process.env.ENCRYPTION_KEY) {
  throw new Error('FATAL: ENCRYPTION_KEY environment variable is missing.');
}
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const ALGORITHM = 'aes-256-gcm';
// Derived 32-byte key buffer for AES-256
const KEY_BUFFER = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();

export function encryptString(text: string): string {
  if (!text) return '';
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY_BUFFER, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag().toString('hex');
  
  // Format: iv:authTag:encryptedData
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export function decryptString(encryptedText: string): string {
  if (!encryptedText) return '';
  
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) return encryptedText; // Fallback for old plaintext records
    
    const [ivHex, authTagHex, encryptedDataHex] = parts;
    const decipher = crypto.createDecipheriv(
      ALGORITHM, 
      KEY_BUFFER, 
      Buffer.from(ivHex, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
    
    let decrypted = decipher.update(encryptedDataHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (err) {
    console.error('Decryption failed', err);
    return encryptedText; // Fallback if decryption fails (e.g. key changed)
  }
}
