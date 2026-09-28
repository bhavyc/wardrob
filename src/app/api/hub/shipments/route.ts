import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { sendListerPickupScheduledNotification } from '@/lib/whatsapp';


export async function GET(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user || (user.role !== 'HUB_PARTNER' && user.role !== 'ADMIN')) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 403 });
    }

    const shipments = await prisma.shipment.findMany({
      include: {
        booking: {
          select: {
            id: true,
            startDate: true,
            endDate: true,
            status: true,
            shippingAddress: true,
            city: true,
            state: true,
            pincode: true,
            contactPhone: true,
            contactName: true,
            listing: {
              select: {
                title: true,
                category: true,
                size: true,
                sku: true,
                baselineImages: true,
                lister: { select: { user: { select: { name: true, phone: true } } } }
              }
            },
            renter: {
              select: { name: true, phone: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, shipments });
  } catch (error: any) {
    console.error('Fetch shipments error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch shipments.' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user || (user.role !== 'HUB_PARTNER' && user.role !== 'ADMIN')) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 403 });
    }

    const body = await request.json();
    const { shipmentId, status, courierName, trackingNumber } = body;

    if (!shipmentId) {
      return NextResponse.json({ success: false, error: 'Missing shipmentId.' }, { status: 400 });
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (courierName !== undefined) updateData.courierName = courierName;
    if (trackingNumber !== undefined) updateData.trackingNumber = trackingNumber;

    if (status === 'IN_TRANSIT') {
      updateData.dispatchedAt = new Date();
    } else if (status === 'DELIVERED') {
      updateData.deliveredAt = new Date();
    }

    const existingShipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: {
        booking: {
          include: {
            listing: {
              include: {
                lister: {
                  include: { user: true }
                }
              }
            }
          }
        }
      }
    });

    if (!existingShipment) {
      return NextResponse.json({ success: false, error: 'Shipment not found.' }, { status: 404 });
    }

    const updatedShipment = await prisma.shipment.update({
      where: { id: shipmentId },
      data: updateData,
    });

    // Notify Lister via WhatsApp when Hub staff schedules/assigns courier pickup (Leg 1)
    if (existingShipment.leg === 'LISTER_TO_HUB') {
      const lister = existingShipment.booking.listing?.lister;
      const listerPhone = lister?.user?.phone;
      
      // Trigger when courier/tracking is assigned or status indicates pickup coordination
      if (listerPhone && (courierName || trackingNumber || status === 'PENDING' || status === 'IN_TRANSIT')) {
        sendListerPickupScheduledNotification({
          phone: listerPhone,
          listerName: lister.shopName || lister.user.name || 'Boutique Partner',
          bookingId: existingShipment.bookingId,
          listingTitle: existingShipment.booking.listing.title,
          courierName: courierName || existingShipment.courierName || 'Wardrob Express Logistics',
          trackingNumber: trackingNumber || existingShipment.trackingNumber,
        }).catch(err => console.error('[WHATSAPP META] Failed to send Lister pickup notification:', err));
      }
    }

    // Synchronize Booking and Listing statuses
    const leg = existingShipment.leg;
    const bookingId = existingShipment.bookingId;
    const listingId = existingShipment.booking.listingId;

    let newBookingStatus;
    let newListingStatus;

    if (leg === 'LISTER_TO_HUB' && status === 'DELIVERED') {
      newBookingStatus = 'AT_HUB_PRE';
      newListingStatus = 'AT_HUB';
    } else if (leg === 'HUB_TO_RENTER') {
      if (status === 'IN_TRANSIT') newBookingStatus = 'OUT_FOR_DELIVERY';
      if (status === 'DELIVERED') {
        newBookingStatus = 'IN_USE';
        newListingStatus = 'RENTED';
      }
    } else if (leg === 'RENTER_TO_HUB' && status === 'DELIVERED') {
      newBookingStatus = 'RETURNED_TO_HUB';
      newListingStatus = 'AT_HUB';
    } else if (leg === 'HUB_TO_LISTER' && status === 'DELIVERED') {
      newBookingStatus = 'COMPLETED';
      newListingStatus = 'UNLISTED'; // Item is withdrawn, so it remains UNLISTED (not AVAILABLE)
    }

    if (newBookingStatus || newListingStatus) {
      await prisma.booking.update({
        where: { id: bookingId },
        data: {
          ...(newBookingStatus && { status: newBookingStatus as any }),
          ...(newListingStatus && {
            listing: { update: { status: newListingStatus as any } }
          })
        }
      });
    }

    return NextResponse.json({ success: true, shipment: updatedShipment });
  } catch (error: any) {
    console.error('Update shipment error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update shipment.' }, { status: 500 });
  }
}
