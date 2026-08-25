import { NextResponse } from 'next/server';

export async function GET() {
  // Predefined active categories matching our artisan clothes marketplace
  const categories = [
    { id: 'all', name: 'All Clothing', count: 2 },
    { id: 'kurtas', name: 'Kurtas & Tunics', count: 1, keywords: ['kurta', 'tunic'] },
    { id: 'shirts', name: 'Artisan Shirts', count: 1, keywords: ['shirt'] },
    { id: 'sarees', name: 'Handloom Sarees', count: 0, keywords: ['saree', 'sari'] },
    { id: 'dupattas', name: 'Dupattas & Stoles', count: 0, keywords: ['dupatta', 'stole'] },
  ];

  // Predefined heritage collections
  const collections = [
    { id: 'indigo', name: 'Indigo Heritage', keywords: ['indigo', 'block-print'] },
    { id: 'khadi', name: 'Organic Khadi', keywords: ['khadi', 'organic'] },
    { id: 'summer', name: 'Casual Summer', keywords: ['summer', 'casual'] },
  ];

  return NextResponse.json({
    success: true,
    categories,
    collections,
  });
}
