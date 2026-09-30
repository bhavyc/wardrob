import { prisma } from '@/lib/db';
import { sendReturnReminder, sendOverdueReminder } from '@/lib/whatsapp';

/**
 * Lazy Check 1: Find bookings ending tomorrow to send WhatsApp reminders.
 * Runs non-blocking on heavily read routes.
 */
export async function sendUpcomingReturnReminders() {
  try {
    const now = new Date();
    // Tomorrow window: 24h to 48h from now
    const tomorrowStart = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowEnd = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    const upcomingBookings = await prisma.booking.findMany({
      where: {
        status: 'IN_USE',
        endDate: {
          gte: tomorrowStart,
          lt: tomorrowEnd,
        },
        returnReminderSentAt: null, // Only send if not already sent
      },
      include: {
        renter: true,
        listing: { select: { title: true } },
      }
    });

    for (const booking of upcomingBookings) {
      if (booking.renter.phone) {
        // Send WhatsApp return pickup reminder via Meta Cloud API
        await sendReturnReminder(
          booking.renter.phone,
          booking.id,
          booking.endDate,
          booking.renter.name,
          booking.listing.title
        );
        
        // Mark as sent to prevent spamming
        await prisma.booking.update({
          where: { id: booking.id },
          data: { returnReminderSentAt: new Date() }
        });
      }
    }
  } catch (error) {
    console.error('Lazy Check Error [sendUpcomingReturnReminders]:', error);
  }
}

/**
 * Lazy Check 2: Find overdue bookings and transition them to RETURNED_TO_HUB.
 * Creates the RENTER_TO_HUB shipment automatically.
 */
export async function processOverdueReturns() {
  try {
    const now = new Date();

    const overdueBookings = await prisma.booking.findMany({
      where: {
        status: 'IN_USE',
        endDate: {
          lt: now, // End date has passed
        }
      }
    });

    for (const booking of overdueBookings) {
      // 1. Create the return shipment (Leg 3)
      await prisma.shipment.create({
        data: {
          bookingId: booking.id,
          leg: 'RENTER_TO_HUB',
          status: 'PENDING',
        }
      });

      // 2. Update booking status
      await prisma.booking.update({
        where: { id: booking.id },
        data: { status: 'RETURNED_TO_HUB' }
      });
      
      console.log(`[LAZY CHECK] Auto-scheduled return for overdue booking ${booking.id}`);
    }
  } catch (error) {
    console.error('Lazy Check Error [processOverdueReturns]:', error);
  }
}

/**
 * Lazy Check 3: Find bookings stuck in RETURNED_TO_HUB and send escalating reminders
 * for Day 1, Day 3, and Day 7 of non-return.
 */
export async function sendEscalatingOverdueReminders() {
  try {
    const now = new Date();
    
    // We look for bookings that are RETURNED_TO_HUB but their endDate has passed
    const stuckBookings = await prisma.booking.findMany({
      where: {
        status: 'RETURNED_TO_HUB',
        endDate: { lt: now },
      },
      include: {
        renter: true,
        listing: { select: { title: true } },
      }
    });

    for (const booking of stuckBookings) {
      if (!booking.renter.phone) continue;

      const diffTime = now.getTime() - booking.endDate.getTime();
      const daysOverdue = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      // Day 1 Reminder (1 to 2 days)
      if (daysOverdue >= 1 && !booking.overdueReminder1SentAt) {
        await sendOverdueReminder(
          booking.renter.phone,
          booking.id,
          daysOverdue,
          1,
          booking.renter.name,
          booking.listing.title
        );
        await prisma.booking.update({
          where: { id: booking.id },
          data: { overdueReminder1SentAt: now }
        });
      }
      // Day 3 Reminder (3 to 6 days)
      else if (daysOverdue >= 3 && !booking.overdueReminder3SentAt) {
        await sendOverdueReminder(
          booking.renter.phone,
          booking.id,
          daysOverdue,
          3,
          booking.renter.name,
          booking.listing.title
        );
        await prisma.booking.update({
          where: { id: booking.id },
          data: { overdueReminder3SentAt: now }
        });
      }
      // Day 7 Reminder (7+ days)
      else if (daysOverdue >= 7 && !booking.overdueReminder7SentAt) {
        await sendOverdueReminder(
          booking.renter.phone,
          booking.id,
          daysOverdue,
          7,
          booking.renter.name,
          booking.listing.title
        );
        await prisma.booking.update({
          where: { id: booking.id },
          data: { overdueReminder7SentAt: now }
        });
      }
    }
  } catch (error) {
    console.error('Lazy Check Error [sendEscalatingOverdueReminders]:', error);
  }
}

/**
 * Lazy Check 4: Unified Hub SLA Monitor across all 3 logistics legs.
 * - Leg 2 (HIGHEST PRIORITY): Rental starts in <36h but not dispatched (Risk of missed customer event)
 * - Leg 1: Lister garment arrived at Hub >24h ago but Intake QC & barcode tagging pending
 * - Leg 3: Renter returned garment >24h ago but Post-Return QC pending (Deposit/Payout safely held)
 */
export async function checkStuckHubInspections() {
  try {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const thirtySixHoursFromNow = new Date(now.getTime() + 36 * 60 * 60 * 1000);

    const hubPartners = await prisma.user.findMany({
      where: { role: 'HUB_PARTNER' },
      select: { id: true },
    });

    if (hubPartners.length === 0) return;

    // 1. LEG 2 (CRITICAL): Rental starts in <36h but outfit is not yet OUT_FOR_DELIVERY / IN_USE
    const dispatchRiskBookings = await prisma.booking.findMany({
      where: {
        status: { in: ['CONFIRMED', 'AT_HUB_PRE'] },
        startDate: { lte: thirtySixHoursFromNow, gte: now },
      },
      include: {
        listing: { select: { title: true } },
      },
    });

    for (const b of dispatchRiskBookings) {
      const shortId = b.id.slice(0, 8);
      const hoursUntilEvent = Math.max(1, Math.round((new Date(b.startDate).getTime() - now.getTime()) / (1000 * 60 * 60)));
      
      const existingAlert = await prisma.notification.findFirst({
        where: {
          type: 'HUB_DISPATCH_RISK',
          message: { contains: shortId },
          createdAt: { gte: new Date(now.getTime() - 12 * 60 * 60 * 1000) }, // 12h debounce for urgent alerts
        },
      });

      if (!existingAlert) {
        for (const partner of hubPartners) {
          await prisma.notification.create({
            data: {
              userId: partner.id,
              type: 'HUB_DISPATCH_RISK',
              title: '🚨 CRITICAL: Dispatch at Risk (Event Soon)',
              message: `Booking #${shortId} (${b.listing.title}) rental starts in ~${hoursUntilEvent}h! Pre-dispatch QC and courier handoff required immediately to avoid missed delivery.`,
              linkUrl: '/hub/inspections',
            },
          });
        }
      }
    }

    // 2. LEG 1: Lister -> Hub parcel delivered >24h ago but no Intake QC logged
    const stuckIntakeBookings = await prisma.booking.findMany({
      where: {
        status: { in: ['CONFIRMED', 'AT_HUB_PRE'] },
        shipments: {
          some: {
            leg: 'LISTER_TO_HUB',
            status: 'DELIVERED',
            deliveredAt: { lt: twentyFourHoursAgo },
          },
        },
        damageReports: {
          none: {
            inspectionType: 'LISTER_TO_HUB_INTAKE',
          },
        },
      },
      include: {
        listing: { select: { title: true } },
      },
    });

    for (const b of stuckIntakeBookings) {
      const shortId = b.id.slice(0, 8);
      const existingAlert = await prisma.notification.findFirst({
        where: {
          type: 'HUB_INTAKE_OVERDUE',
          message: { contains: shortId },
          createdAt: { gte: twentyFourHoursAgo },
        },
      });

      if (!existingAlert) {
        for (const partner of hubPartners) {
          await prisma.notification.create({
            data: {
              userId: partner.id,
              type: 'HUB_INTAKE_OVERDUE',
              title: '📦 Leg 1: Intake QC Overdue (>24h at Hub)',
              message: `Booking #${shortId} (${b.listing.title}) was received from Lister over 24h ago. Please log intake baseline photos & attach barcode tag.`,
              linkUrl: '/hub/inspections',
            },
          });
        }
      }
    }

    // 3. LEG 3: Renter -> Hub parcel delivered >24h ago but no Post-Return QC logged
    const stuckReturnBookings = await prisma.booking.findMany({
      where: {
        status: { in: ['RETURNED_TO_HUB', 'IN_USE'] },
        OR: [
          {
            shipments: {
              some: {
                leg: 'RENTER_TO_HUB',
                status: 'DELIVERED',
                deliveredAt: { lt: twentyFourHoursAgo },
              },
            },
          },
          {
            status: 'RETURNED_TO_HUB',
            updatedAt: { lt: twentyFourHoursAgo },
          },
        ],
        damageReports: {
          none: {
            inspectionType: 'POST_RETURN',
          },
        },
      },
      include: {
        listing: { select: { title: true } },
      },
    });

    for (const b of stuckReturnBookings) {
      const shortId = b.id.slice(0, 8);
      const existingAlert = await prisma.notification.findFirst({
        where: {
          type: 'HUB_RETURN_OVERDUE',
          message: { contains: shortId },
          createdAt: { gte: twentyFourHoursAgo },
        },
      });

      if (!existingAlert) {
        for (const partner of hubPartners) {
          await prisma.notification.create({
            data: {
              userId: partner.id,
              type: 'HUB_RETURN_OVERDUE',
              title: '💸 Leg 3: Return QC Overdue (>24h at Hub)',
              message: `Booking #${shortId} (${b.listing.title}) returned over 24h ago. Complete post-return inspection with 3 photos to release security deposit & payout.`,
              linkUrl: '/hub/inspections',
            },
          });
        }
      }
    }
  } catch (error) {
    console.error('Lazy Check Error [checkStuckHubInspections]:', error);
  }
}


