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
      }
    });

    for (const booking of upcomingBookings) {
      if (booking.renter.phone) {
        // Send WhatsApp stub
        await sendReturnReminder(booking.renter.phone, booking.id, booking.endDate);
        
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
      include: { renter: true }
    });

    for (const booking of stuckBookings) {
      if (!booking.renter.phone) continue;

      const diffTime = now.getTime() - booking.endDate.getTime();
      const daysOverdue = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      // Day 1 Reminder (1 to 2 days)
      if (daysOverdue >= 1 && !booking.overdueReminder1SentAt) {
        await sendOverdueReminder(booking.renter.phone, booking.id, daysOverdue, 1);
        await prisma.booking.update({
          where: { id: booking.id },
          data: { overdueReminder1SentAt: now }
        });
      }
      // Day 3 Reminder (3 to 6 days)
      else if (daysOverdue >= 3 && !booking.overdueReminder3SentAt) {
        await sendOverdueReminder(booking.renter.phone, booking.id, daysOverdue, 3);
        await prisma.booking.update({
          where: { id: booking.id },
          data: { overdueReminder3SentAt: now }
        });
      }
      // Day 7 Reminder (7+ days)
      else if (daysOverdue >= 7 && !booking.overdueReminder7SentAt) {
        await sendOverdueReminder(booking.renter.phone, booking.id, daysOverdue, 7);
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
