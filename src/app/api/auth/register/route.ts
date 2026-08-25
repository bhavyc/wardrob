import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { encryptString } from '@/lib/encryption';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, password, confirmPassword, aadhaarNumber, panNumber } = body;

    // Validate required fields
    if (!name || !email || !phone || !password || !confirmPassword || !aadhaarNumber || !panNumber) {
      return NextResponse.json(
        { success: false, error: 'All fields including KYC details (Aadhaar, PAN) are required.' },
        { status: 400 }
      );
    }

    if (name.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'Name must be at least 2 characters.' },
        { status: 400 }
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    // Phone validation (10-digit Indian number)
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone.trim())) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid 10-digit Indian mobile number.' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters long.' },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: 'Passwords do not match.' },
        { status: 400 }
      );
    }

    if (aadhaarNumber.length !== 12 || isNaN(Number(aadhaarNumber))) {
      return NextResponse.json(
        { success: false, error: 'Aadhaar number must be exactly 12 digits.' },
        { status: 400 }
      );
    }

    if (panNumber.length !== 10) {
      return NextResponse.json(
        { success: false, error: 'PAN card number must be exactly 10 characters.' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const emailExists = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    if (emailExists) {
      return NextResponse.json(
        { success: false, error: 'An account with this email already exists.' },
        { status: 400 }
      );
    }

    // Check if phone already exists
    const phoneExists = await prisma.user.findUnique({
      where: { phone: phone.trim() },
    });
    if (phoneExists) {
      return NextResponse.json(
        { success: false, error: 'This phone number is already registered.' },
        { status: 400 }
      );
    }

    // Create the renter user (KYC docs stored for record, no approval gate)
    await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        passwordHash: await bcrypt.hash(password, 10),
        aadhaarNumber: encryptString(aadhaarNumber.trim()),
        panNumber: encryptString(panNumber.trim().toUpperCase()),
        role: 'RENTER',
        idVerified: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Account created successfully! Please log in.',
    });
  } catch (error: any) {
    console.error('Renter Register API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error. Please try again.' },
      { status: 500 }
    );
  }
}
