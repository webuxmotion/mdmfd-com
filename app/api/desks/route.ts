import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getDatabase } from '../../lib/mongodb';
import { initialDesks } from '../../data/desks';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json([]);
    }

    const userId = session.user.id;
    const db = await getDatabase();
    const desks = await db.collection('desks').find({ userId }).toArray();

    if (desks.length === 0) {
      const userDesks = initialDesks.map(desk => ({ ...desk, userId }));
      await db.collection('desks').insertMany(userDesks);
      return NextResponse.json(userDesks);
    }

    return NextResponse.json(desks);
  } catch (error) {
    console.error('Error fetching desks:', error);
    return NextResponse.json({ error: 'Failed to fetch desks' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    const db = await getDatabase();
    const body = await request.json();

    const newDesk = {
      id: String(Date.now()),
      ...body,
      ...(session?.user?.id && { userId: session.user.id }),
    };

    await db.collection('desks').insertOne(newDesk);
    return NextResponse.json(newDesk, { status: 201 });
  } catch (error) {
    console.error('Error creating desk:', error);
    return NextResponse.json({ error: 'Failed to create desk' }, { status: 500 });
  }
}
