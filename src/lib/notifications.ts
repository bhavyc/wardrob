import { prisma } from '@/lib/db';

export type NotificationType =
  | 'ORDER_CONFIRMED'     // 🛍️ Renter
  | 'DEPOSIT_REFUNDED'    // 💸 Renter
  | 'NEW_BOOKING'         // 📦 Lister
  | 'PAYOUT_DISPATCHED'   // 💰 Lister
  | 'KYC_STATUS';         // 🛡️ Lister

export async function sendNotification({
  userId,
  title,
  message,
  type = 'INFO',
  linkUrl,
}: {
  userId: string;
  title: string;
  message: string;
  type: NotificationType | string;
  linkUrl?: string;
}) {
  try {
    return await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        linkUrl,
      },
    });
  } catch (err) {
    console.error('Failed to create notification:', err);
    return null;
  }
}
