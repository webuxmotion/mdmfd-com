import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getDatabase } from '../../../../../lib/mongodb';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id: deskId, itemId } = await params;
    const session = await auth();
    const db = await getDatabase();
    const body = await request.json();

    const query: { id: string; 'items.id': string; userId?: string } = {
      id: deskId,
      'items.id': itemId,
    };
    if (session?.user?.id) {
      query.userId = session.user.id;
    }

    const result = await db.collection('desks').updateOne(
      query,
      {
        $set: {
          'items.$.title': body.title,
          'items.$.link': body.link,
          'items.$.description': body.description,
          'items.$.readme': body.readme,
          'items.$.type': body.type,
          'items.$.image': body.image,
        },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, ...body });
  } catch (error) {
    console.error('Error updating item:', error);
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id: deskId, itemId } = await params;
    const session = await auth();
    const db = await getDatabase();

    const query: { id: string; userId?: string } = { id: deskId };
    if (session?.user?.id) {
      query.userId = session.user.id;
    }

    const result = await db.collection('desks').updateOne(
      query,
      { $pull: { items: { id: itemId } } } as any
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Desk not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting item:', error);
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}
