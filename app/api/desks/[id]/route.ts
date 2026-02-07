import { NextResponse } from 'next/server';
import { getDatabase } from '../../../lib/mongodb';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDatabase();
    const desk = await db.collection('desks').findOne({ id });

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
    const db = await getDatabase();
    const body = await request.json();

    const result = await db.collection('desks').updateOne(
      { id },
      { $set: body }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Desk not found' }, { status: 404 });
    }

    const updatedDesk = await db.collection('desks').findOne({ id });
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
    const db = await getDatabase();

    const result = await db.collection('desks').deleteOne({ id });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Desk not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting desk:', error);
    return NextResponse.json({ error: 'Failed to delete desk' }, { status: 500 });
  }
}
