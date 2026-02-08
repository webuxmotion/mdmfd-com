import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getDatabase } from '../../../lib/mongodb';

export async function POST(request: Request) {
  try {
    const session = await auth();
    const db = await getDatabase();
    const { deskId, itemIds } = await request.json();

    const userId = session?.user?.id;

    // Build query with optional userId
    const query: { id: string; userId?: string } = { id: deskId };
    if (userId) {
      query.userId = userId;
    }

    // Get the current desk
    const desk = await db.collection('desks').findOne(query);
    if (!desk) {
      return NextResponse.json({ error: 'Desk not found' }, { status: 404 });
    }

    // Reorder items based on itemIds array
    const orderedItems = itemIds
      .map((id: string) => desk.items?.find((item: { id: string }) => item.id === id))
      .filter((item: unknown) => item !== undefined);

    // Update the desk with reordered items
    await db.collection('desks').updateOne(
      query,
      { $set: { items: orderedItems } }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering items:', error);
    return NextResponse.json({ error: 'Failed to reorder items' }, { status: 500 });
  }
}
