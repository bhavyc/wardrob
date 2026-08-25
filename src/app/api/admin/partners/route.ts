import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 403 });
    }

    const partners = await prisma.user.findMany({
      where: { role: 'HUB_PARTNER' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        idVerified: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, partners });
  } catch (error: any) {
    console.error('Admin Partners GET Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 403 });
    }

    const { name, email, phone, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ success: false, error: 'Name, email, and password are required.' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      // Update role to HUB_PARTNER
      const updated = await prisma.user.update({
        where: { email },
        data: { role: 'HUB_PARTNER', name, phone: phone || existing.phone, passwordHash },
      });
      return NextResponse.json({ success: true, partner: updated, message: 'Existing user role updated to HUB_PARTNER.' });
    }

    const newPartner = await prisma.user.create({
      data: {
        name,
        email,
        phone: phone || null,
        passwordHash,
        role: 'HUB_PARTNER',
        idVerified: true,
      },
    });

    return NextResponse.json({ success: true, partner: newPartner, message: 'Hub Partner created successfully.' });
  } catch (error: any) {
    console.error('Admin Partners POST Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
