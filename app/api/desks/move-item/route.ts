import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getDatabase } from '../../../lib/mongodb';

export async function POST(request: Request) {
  try {
    const session = await auth();
    const db = await getDatabase();
    const { sourceDeskId, targetDeskId, itemId } = await request.json();

    const userId = session?.user?.id;

    // Build query with optional userId
    const sourceQuery: { id: string; userId?: string } = { id: sourceDeskId };
    const targetQuery: { id: string; userId?: string } = { id: targetDeskId };
    if (userId) {
      sourceQuery.userId = userId;
      targetQuery.userId = userId;
    }

    // Find and get the item from source desk
    const sourceDesk = await db.collection('desks').findOne(sourceQuery);
    if (!sourceDesk) {
      return NextResponse.json({ error: 'Source desk not found' }, { status: 404 });
    }

    const itemToMove = sourceDesk.items?.find((item: { id: string }) => item.id === itemId);
    if (!itemToMove) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Verify target desk exists
    const targetDesk = await db.collection('desks').findOne(targetQuery);
    if (!targetDesk) {
      return NextResponse.json({ error: 'Target desk not found' }, { status: 404 });
    }

    // Remove from source desk
    await db.collection('desks').updateOne(
      sourceQuery,
      { $pull: { items: { id: itemId } } } as any
    );

    // Add to target desk
    await db.collection('desks').updateOne(
      targetQuery,
      { $push: { items: itemToMove } }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error moving item:', error);
    return NextResponse.json({ error: 'Failed to move item' }, { status: 500 });
  }
}
