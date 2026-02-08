import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getDatabase } from '../../../lib/mongodb';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    const db = await getDatabase();

    const query: { id: string; userId?: string } = { id };
    if (session?.user?.id) {
      query.userId = session.user.id;
    }

    const desk = await db.collection('desks').findOne(query);

    if (!desk) {
      return NextResponse.json({ error: 'Desk not found' }, { status: 404 });
    }

    return NextResponse.json(desk);
  } catch (error) {
    console.error('Error fetching desk:', error);
    return NextResponse.json({ error: 'Failed to fetch desk' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    const db = await getDatabase();
    const body = await request.json();

    const query: { id: string; userId?: string } = { id };
    if (session?.user?.id) {
      query.userId = session.user.id;
    }

    const result = await db.collection('desks').updateOne(
      query,
      { $set: body }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Desk not found' }, { status: 404 });
    }

    const updatedDesk = await db.collection('desks').findOne(query);
    return NextResponse.json(updatedDesk);
  } catch (error) {
    console.error('Error updating desk:', error);
    return NextResponse.json({ error: 'Failed to update desk' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    const db = await getDatabase();

    const query: { id: string; userId?: string } = { id };
    if (session?.user?.id) {
      query.userId = session.user.id;
    }

    const result = await db.collection('desks').deleteOne(query);

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Desk not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting desk:', error);
    return NextResponse.json({ error: 'Failed to delete desk' }, { status: 500 });
  }
}
