import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: { damageReports: true }
    });

    if (!booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 });
    }

    if (booking.renterId !== user.userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    // Find the POST_RETURN damage report
    const postReturnReport = booking.damageReports.find(r => r.inspectionType === 'POST_RETURN');

    if (!postReturnReport) {
      return NextResponse.json({ success: false, error: 'No return inspection found to dispute' }, { status: 400 });
    }

    if (postReturnReport.isDisputed) {
      return NextResponse.json({ success: false, error: 'This report is already disputed' }, { status: 400 });
    }

    if (postReturnReport.grade === 'A_NO_ISSUE') {
      return NextResponse.json({ success: false, error: 'You cannot dispute a Grade A return' }, { status: 400 });
    }

    const { reason } = await request.json();

    if (!reason || reason.trim() === '') {
      return NextResponse.json({ success: false, error: 'Dispute reason is required' }, { status: 400 });
    }

    // Create the Dispute and mark report as disputed
    await prisma.damageReport.update({
      where: { id: postReturnReport.id },
      data: { isDisputed: true }
    });

    await prisma.dispute.create({
      data: {
        damageReportId: postReturnReport.id,
        status: 'OPEN',
        raisedBy: user.userId,
        reason: reason.trim()
      }
    });

    return NextResponse.json({ success: true, message: 'Dispute submitted. Admin will review the case.' });

  } catch (error: any) {
    console.error('Dispute API Error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
