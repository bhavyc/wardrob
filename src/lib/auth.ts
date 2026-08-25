import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

if (!process.env.JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is missing.');
}
const JWT_SECRET = process.env.JWT_SECRET;

export interface AuthUser {
  userId: string;
  role: string;
  phone?: string;
}

export async function getAuthUser(req?: Request): Promise<AuthUser | null> {
  try {
    let token: string | null = null;

    // 1.Try Authorization header (Flutter app)
    if (req) {
      const authHeader = req.headers.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    // 2.Try cookies (Web client)
    if (!token) {
      const cookieStore = await cookies();
      token = cookieStore.get('auth_token')?.value || null;
    }

    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    return decoded;
  } catch (error) {
    console.error('Auth verification error:', error);
    return null;
  }
}
