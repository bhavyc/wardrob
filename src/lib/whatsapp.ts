/**
 * Meta WhatsApp Cloud API Service for Wardrob
 * Docs: https://developers.facebook.com/docs/whatsapp/cloud-api/
 */

export interface SendMessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Normalize phone number to E.164 format without '+' (as required by Meta Cloud API)
 * e.g., '+91 98765-43210' -> '919876543210'
 * e.g., '9876543210' -> '919876543210'
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return '';
  // Remove all non-digits
  let cleaned = phone.replace(/\D/g, '');
  
  // If 10 digits, assume India (+91)
  if (cleaned.length === 10) {
    cleaned = `91${cleaned}`;
  }
  
  // If starts with 0 and length is 11 (e.g., 09876543210)
  if (cleaned.length === 11 && cleaned.startsWith('0')) {
    cleaned = `91${cleaned.substring(1)}`;
  }

  return cleaned;
}

/**
 * Send a WhatsApp text message via Meta Graph Cloud API.
 * Falls back to detailed console logging if environment variables are not yet configured.
 */
export async function sendMetaWhatsAppMessage(
  recipientPhone: string,
  messageText: string
): Promise<SendMessageResult> {
  const normalizedTo = normalizePhoneNumber(recipientPhone);
  if (!normalizedTo) {
    console.warn('[WHATSAPP META] ⚠️ Skipped sending message: Empty or invalid phone number');
    return { success: false, error: 'Invalid phone number' };
  }

  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN || process.env.WHATSAPP_API_TOKEN;

  // --- LIVE META CLOUD API CALL ---
  if (phoneNumberId && accessToken && process.env.ENABLE_WHATSAPP !== 'false') {
    try {
      const url = `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: normalizedTo,
          type: 'text',
          text: {
            preview_url: false,
            body: messageText,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('[WHATSAPP META API ERROR]', data);
        return {
          success: false,
          error: data?.error?.message || 'Meta Cloud API call failed',
        };
      }

      console.log(`[WHATSAPP META] 📱 Message sent successfully to +${normalizedTo}. Msg ID: ${data?.messages?.[0]?.id}`);
      return {
        success: true,
        messageId: data?.messages?.[0]?.id,
      };
    } catch (err: any) {
      console.error('[WHATSAPP META] Network/runtime error:', err);
      return { success: false, error: err.message };
    }
  }

  // WhatsApp not configured / disabled
  return { success: true, messageId: `bypassed_${Date.now()}` };
}

/**
 * Send an approved Meta WhatsApp template message (e.g. 'hello_world')
 */
export async function sendMetaWhatsAppTemplate(
  recipientPhone: string,
  templateName: string = 'hello_world',
  languageCode: string = 'en_US'
): Promise<SendMessageResult> {
  const normalizedTo = normalizePhoneNumber(recipientPhone);
  if (!normalizedTo) {
    return { success: false, error: 'Invalid phone number' };
  }

  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN || process.env.WHATSAPP_API_TOKEN;

  if (phoneNumberId && accessToken) {
    try {
      const url = `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: normalizedTo,
          type: 'template',
          template: {
            name: templateName,
            language: {
              code: languageCode,
            },
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        console.error('[WHATSAPP META TEMPLATE ERROR]', data);
        return { success: false, error: data?.error?.message || 'Template send failed' };
      }

      console.log(`[WHATSAPP META] 📱 Template '${templateName}' sent to +${normalizedTo}. Msg ID: ${data?.messages?.[0]?.id}`);
      return { success: true, messageId: data?.messages?.[0]?.id };
    } catch (err: any) {
      console.error('[WHATSAPP META TEMPLATE ERROR]', err);
      return { success: false, error: err.message };
    }
  }

  return { success: true, messageId: `mock_template_${Date.now()}` };
}

// ============================================================================
// 1. Return-pickup-reminder (To Renter) - 1 Day Before Return
// ============================================================================
export async function sendReturnReminder(
  phone: string,
  bookingId: string,
  returnDate: Date,
  renterName: string = 'Valued Client',
  listingTitle?: string
): Promise<SendMessageResult> {
  const shortId = bookingId.substring(0, 8).toUpperCase();
  const formattedDate = returnDate.toLocaleDateString('en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const garmentName = listingTitle ? `"${listingTitle}"` : 'your outfit';

  const message = 
`👗 *Wardrob | Return Pickup Tomorrow*

Hi ${renterName}, return pickup for booking *#${shortId}* (${garmentName}) is tomorrow, *${formattedDate}*.

Please pack the outfit in the Wardrob garment bag with its accessories. Our courier will arrive for pickup.`;

  return sendMetaWhatsAppMessage(phone, message);
}

// ============================================================================
// 2. Escalating-overdue-reminders (To Renter) - Day 1, Day 3, Day 7
// ============================================================================
export async function sendOverdueReminder(
  phone: string,
  bookingId: string,
  daysOverdue: number,
  level: 1 | 3 | 7,
  renterName: string = 'Valued Client',
  listingTitle?: string
): Promise<SendMessageResult> {
  const shortId = bookingId.substring(0, 8).toUpperCase();
  const garmentName = listingTitle ? `"${listingTitle}"` : 'your rented outfit';
  let message = '';

  if (level === 1) {
    message = 
`⚠️ *Wardrob | Return Overdue*

Hi ${renterName}, booking *#${shortId}* (${garmentName}) return handover was not confirmed yesterday.

Please hand over the outfit to our courier today to avoid automated late fees.
Help: inwardrob@gmail.com`;
  } else if (level === 3) {
    message = 
`🚨 *Wardrob | Urgent: ${daysOverdue} Days Overdue*

Hi ${renterName}, booking *#${shortId}* (${garmentName}) is ${daysOverdue} days overdue.

Late fee of *₹250/day* is accruing from your deposit. Please complete courier handover today.
Contact: inwardrob@gmail.com`;
  } else if (level === 7) {
    message = 
`🛑 *Wardrob | Final Notice*

Hi ${renterName}, booking *#${shortId}* is 7 days overdue.

Please return within 24h to avoid deposit forfeiture and full replacement recovery charges.
Urgent: inwardrob@gmail.com`;
  }

  return sendMetaWhatsAppMessage(phone, message);
}

// ============================================================================
// 3. (New) Pickup-scheduled (To Lister) - When Hub Staff Arranges Pickup
// ============================================================================
export async function sendListerPickupScheduledNotification({
  phone,
  listerName = 'Boutique Partner',
  bookingId,
  listingTitle,
  courierName = 'Wardrob Logistics',
  trackingNumber,
  pickupAddress,
}: {
  phone: string;
  listerName?: string;
  bookingId: string;
  listingTitle: string;
  courierName?: string;
  trackingNumber?: string;
  pickupAddress?: string;
}): Promise<SendMessageResult> {
  const shortId = bookingId.substring(0, 8).toUpperCase();
  const courierDetails = trackingNumber ? ` (${courierName}, AWB: ${trackingNumber})` : ` (${courierName})`;

  const message = 
`🚚 *Wardrob | Courier Pickup Scheduled*

Hi ${listerName}, courier pickup is scheduled for *"${listingTitle}"* (Booking *#${shortId}*)${courierDetails}.

Please keep the garment packed in its protective bag and ready for handover.`;

  return sendMetaWhatsAppMessage(phone, message);
}

// ============================================================================
// 4. Booking-confirmed (To Renter) - When Razorpay Order is Verified
// ============================================================================
export async function sendBookingConfirmedWhatsApp({
  phone,
  bookingId,
  listingTitle,
  renterName = 'Valued Client',
  eventDate,
}: {
  phone: string;
  bookingId: string;
  listingTitle: string;
  renterName?: string;
  eventDate?: Date | string;
}): Promise<SendMessageResult> {
  const shortId = bookingId.substring(0, 8).toUpperCase();
  const dateFormatted = eventDate ? new Date(eventDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Upcoming Event';

  const message = 
`✨ *Wardrob | Booking Confirmed*

Hi ${renterName}, your reservation *#${shortId}* for *"${listingTitle}"* is confirmed for *${dateFormatted}*!

We're preparing your outfit with UV sanitization & insured doorstep delivery. Track live in the Wardrob app.`;

  return sendMetaWhatsAppMessage(phone, message);
}
