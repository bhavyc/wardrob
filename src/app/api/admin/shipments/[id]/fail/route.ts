import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params;
    const user = await getAuthUser(request);
    
    // Only Admin (or potentially Hub Partner) can mark this
    if (!user || (user.role !== 'ADMIN' && user.role !== 'HUB_PARTNER')) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Admin/Hub access required.' }, { status: 403 });
    }

    const shipmentId = params.id;
    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId }
    });

    if (!shipment) {
      return NextResponse.json({ success: false, error: 'Shipment not found' }, { status: 404 });
    }

    if (shipment.status === 'DELIVERED') {
      return NextResponse.json({ success: false, error: 'Cannot fail a delivered shipment' }, { status: 400 });
    }

    await prisma.shipment.update({
      where: { id: shipmentId },
      data: { status: 'PICKUP_FAILED' }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Shipment marked as PICKUP_FAILED.' 
    });

  } catch (error: any) {
    console.error('Shipment Fail Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
