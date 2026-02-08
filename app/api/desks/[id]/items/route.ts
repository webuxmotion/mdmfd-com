import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getDatabase } from '../../../../lib/mongodb';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: deskId } = await params;
    const session = await auth();
    const db = await getDatabase();
    const body = await request.json();

    const query: { id: string; userId?: string } = { id: deskId };
    if (session?.user?.id) {
      query.userId = session.user.id;
    }

    const newItem = {
      id: String(Date.now()),
      ...body,
    };

    const result = await db.collection('desks').updateOne(
      query,
      { $push: { items: newItem } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Desk not found' }, { status: 404 });
    }

    return NextResponse.json(newItem, { status: 201 });
  } catch (error) {
    console.error('Error adding item:', error);
    return NextResponse.json({ error: 'Failed to add item' }, { status: 500 });
  }
}
