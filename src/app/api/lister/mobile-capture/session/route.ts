import { NextResponse } from 'next/server';
import crypto from 'crypto';
import os from 'os';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

function getLocalIp(): string {
  try {
    const nets = os.networkInterfaces();
    for (const name of Object.keys(nets)) {
      for (const net of nets[name] || []) {
        if (net.family === 'IPv4' && !net.internal) {
          return net.address;
        }
      }
    }
  } catch (e) {
    // fallback
  }
  return 'localhost';
}

export async function POST(request: Request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser || authUser.role !== 'LISTER') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Lister access required.' },
        { status: 401 }
      );
    }

    // Expire any existing active sessions for this user
    await prisma.listerMobileCaptureSession.updateMany({
      where: {
        userId: authUser.userId,
        status: 'ACTIVE'
      },
      data: {
        status: 'EXPIRED'
      }
    });

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes validity

    const session = await prisma.listerMobileCaptureSession.create({
      data: {
        token,
        userId: authUser.userId,
        status: 'ACTIVE',
        photos: [],
        expiresAt
      }
    });

    const rawHost = request.headers.get('host') || 'localhost:3000';
    const proto = request.headers.get('x-forwarded-proto') || 'http';

    let resolvedHost = rawHost;
    // Replace with LAN IP so scanning the QR code on a mobile device connects seamlessly.
    if (resolvedHost.startsWith('localhost') || resolvedHost.startsWith('127.0.0.1')) {
      const port = resolvedHost.includes(':') ? resolvedHost.split(':')[1] : '3000';
      const localIp = getLocalIp();
      resolvedHost = `${localIp}:${port}`;
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${proto}://${resolvedHost}`;
    const captureUrl = `${baseUrl}/lister/mobile-capture/${token}`;

    return NextResponse.json({
      success: true,
      token: session.token,
      captureUrl,
      expiresAt: session.expiresAt.toISOString()
    });
  } catch (error: any) {
    console.error('Error creating lister mobile capture session:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { token, status } = await request.json();
    if (!token || !status) {
      return NextResponse.json(
        { success: false, error: 'Token and status are required.' },
        { status: 400 }
      );
    }

    if (status !== 'COMPLETED' && status !== 'EXPIRED') {
      return NextResponse.json(
        { success: false, error: 'Invalid status provided.' },
        { status: 400 }
      );
    }

    const existingSession = await prisma.listerMobileCaptureSession.findUnique({
      where: { token }
    });

    if (!existingSession) {
      return NextResponse.json(
        { success: false, error: 'Capture session not found.' },
        { status: 404 }
      );
    }

    const updated = await prisma.listerMobileCaptureSession.update({
      where: { token },
      data: { status }
    });

    return NextResponse.json({
      success: true,
      session: {
        token: updated.token,
        status: updated.status
      }
    });
  } catch (error: any) {
    console.error('Error updating lister mobile capture session:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
