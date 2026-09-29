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

  // --- DEV / STUB SIMULATION MODE ---
  console.log(`\n================== [WHATSAPP META CLOUD API (DEV SIMULATION)] ==================`);
  console.log(`📱 Recipient Phone: +${normalizedTo} (Raw: ${recipientPhone})`);
  console.log(`💬 Message Content:\n${messageText}`);
  console.log(`ℹ️ [Tip] Set WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN in .env for live Meta delivery.`);
  console.log(`=================================================================================\n`);

  return { success: true, messageId: `mock_meta_${Date.now()}` };
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
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const garmentName = listingTitle ? `"${listingTitle}"` : 'your designer outfit';

  const message = 
`👗 *Wardrob Concierge | Return Pickup Reminder*

Dear ${renterName},

Your return pickup for booking *#${shortId}* (${garmentName}) is scheduled for tomorrow, *${formattedDate}*.

📦 *Preparation Guidelines:*
1. Kindly place the garment inside the complimentary Wardrob garment bag on its original hanger.
2. Ensure all accessories (belts, brooches, detachable pieces) are safely enclosed.
3. Our courier partner will arrive at your address tomorrow for the scheduled collection.

Need an event extension or assistance? You can manage your booking via the Wardrob app or simply reply to this message.

Warm regards,
*The Wardrob Concierge Team*`;

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
  const garmentName = listingTitle ? `"${listingTitle}"` : 'your rented designer outfit';
  let message = '';

  if (level === 1) {
    message = 
`⚠️ *Wardrob Notice | Rental Return Overdue*

Dear ${renterName},

Your rental booking *#${shortId}* (${garmentName}) was scheduled for return yesterday, but the courier handover has not yet been confirmed.

If the courier was unable to connect with you, please arrange the handover today or contact our support team immediately to prevent automated late fees from applying.

Assistance: support@wardrob.in | Reply to this WhatsApp
*Wardrob Operations*`;
  } else if (level === 3) {
    message = 
`🚨 *Wardrob Urgent Alert | Rental Overdue (${daysOverdue} Days)*

Dear ${renterName},

Your rental booking *#${shortId}* (${garmentName}) is now *${daysOverdue} days overdue*.

In accordance with our rental policy, late penalty charges of *₹250 per day* are currently accruing and will be deducted from your security deposit.

Please hand over the garment to our courier partner today to prevent further deposit deductions and account restrictions.

Direct Concierge Helpline: +91-9876543210
*Wardrob Escrow & Asset Protection*`;
  } else if (level === 7) {
    message = 
`🛑 *Wardrob FINAL LEGAL NOTICE | Day 7 Non-Return*

Dear ${renterName},

Your rental booking *#${shortId}* (${garmentName}) is now *7 days past its return date*.

Please be advised that if the garment is not received within the next *48 hours*:
1. Your entire refundable security deposit will be forfeited.
2. Full garment replacement costs and associated recovery charges will be levied.
3. Your Wardrob account will be permanently suspended and flagged.

Please contact our escalation desk immediately to coordinate the return and avoid formal action.

Escalations: support@wardrob.in | +91-9876543210
*Wardrob Legal & Compliance Desk*`;
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
  courierName = 'Wardrob Express Logistics',
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
  const trackingInfo = trackingNumber ? `\n• *AWB / Tracking:* ${trackingNumber}` : '';
  const addressInfo = pickupAddress ? `\n• *Pickup Location:* ${pickupAddress}` : '';

  const message = 
`✨ *Wardrob Boutique Alert | Courier Pickup Scheduled*

Dear ${listerName},

A courier pickup has been scheduled for your designer piece *"${listingTitle}"*!

🚚 *Pickup Logistics:*
• *Booking Reference:* #${shortId}
• *Courier Partner:* ${courierName}${trackingInfo}${addressInfo}
• *Destination:* Wardrob Central Hub (QC Inspection & Steam Sanitization)

Kindly ensure the garment is ready in its protective bag and hanger for a smooth handover. Our delivery partner will arrive shortly.

You can monitor the live transit status anytime in your Wardrob Lister Portal.

Best regards,
*Wardrob Operations & Logistics Desk*`;

  return sendMetaWhatsAppMessage(phone, message);
}
