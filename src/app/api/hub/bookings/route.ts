import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { sendUpcomingReturnReminders, processOverdueReturns, sendEscalatingOverdueReminders } from '@/lib/lazy-checks';

export async function GET(request: Request) {
  try {
    // Non-blocking lazy checks
    sendUpcomingReturnReminders().catch(console.error);
    processOverdueReturns().catch(console.error);
    sendEscalatingOverdueReminders().catch(console.error);

    const user = await getAuthUser(request);
    if (!user || (user.role !== 'HUB_PARTNER' && user.role !== 'ADMIN')) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 403 });
    }

    // Fetch bookings that need Pre-Dispatch Inspection
    const preDispatchBookingsRaw = await prisma.booking.findMany({
      where: {
        status: { in: ['CONFIRMED', 'AT_HUB_PRE'] },
      },
      include: {
        listing: {
          include: {
            lister: {
              include: {
                user: { select: { name: true, phone: true } },
              },
            },
          },
        },
        renter: { select: { name: true, phone: true } },
        shipments: true,
        damageReports: true,
      },
      orderBy: { startDate: 'asc' },
    });

    const intakeBookings = preDispatchBookingsRaw.filter(b => {
      // Needs Stage 1: Lister Intake if intake QC & barcode tagging hasn't been logged yet
      const hasIntake = b.damageReports?.some(d => d.inspectionType === 'LISTER_TO_HUB_INTAKE');
      return !hasIntake;
    });

    const preDispatchBookings = preDispatchBookingsRaw.filter(b => {
      // Ready for Stage 2: Pre-Dispatch only AFTER intake QC has been completed
      const hasIntake = b.damageReports?.some(d => d.inspectionType === 'LISTER_TO_HUB_INTAKE');
      const hasPreDispatch = b.damageReports?.some(d => d.inspectionType === 'PRE_DISPATCH');

      if (hasIntake && !hasPreDispatch) return true;

      // Existing warehouse inventory item fallback (already tagged, at hub, no incoming lister shipment)
      const hasListerShipment = b.shipments?.some(s => s.leg === 'LISTER_TO_HUB');
      if (!hasListerShipment && b.listing.sku && b.listing.status === 'AT_HUB' && !hasPreDispatch) {
        return true;
      }

      return false;
    });

    // Fetch bookings that need Post-Return Inspection
    const postReturnBookings = await prisma.booking.findMany({
      where: {
        status: { in: ['IN_USE', 'RETURNED_TO_HUB'] },
      },
      include: {
        listing: {
          include: {
            lister: {
              include: {
                user: { select: { name: true, phone: true } },
              },
            },
          },
        },
        renter: { select: { name: true, phone: true } },
        shipments: true,
      },
      orderBy: { endDate: 'asc' },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const returnsDueToday = postReturnBookings.filter(b => {
      // Find items that are IN_USE and their endDate is today or earlier
      if (b.status === 'IN_USE') {
        const endDate = new Date(b.endDate);
        endDate.setHours(0, 0, 0, 0);
        return endDate <= today;
      }
      return false;
    });

    // Fetch recent completed inspections (DamageReports) for History/Record keeping
    const recentInspections = await prisma.damageReport.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
        booking: {
          include: {
            listing: {
              include: {
                lister: {
                  include: {
                    user: { select: { name: true, phone: true } },
                  },
                },
              },
            },
            renter: { select: { name: true, phone: true } },
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      intakeBookings,
      preDispatchBookings,
      postReturnBookings,
      returnsDueToday,
      recentInspections,
    });
  } catch (error: any) {
    console.error('Hub Bookings API Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
