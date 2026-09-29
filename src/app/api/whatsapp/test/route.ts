import { NextResponse } from 'next/server';
import { sendMetaWhatsAppMessage, sendMetaWhatsAppTemplate } from '@/lib/whatsapp';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const phone = body.phone || '918383941267';
    const useTemplate = body.useTemplate !== false; // default true for first-contact test

    let result;
    if (useTemplate) {
      result = await sendMetaWhatsAppTemplate(phone, body.template || 'hello_world', 'en_US');
    } else {
      result = await sendMetaWhatsAppMessage(phone, body.message || 'Hello from Wardrob Haute Archive!');
    }

    return NextResponse.json({
      success: result.success,
      result,
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
      hasToken: !!process.env.WHATSAPP_ACCESS_TOKEN,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
