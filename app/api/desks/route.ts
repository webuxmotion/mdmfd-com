import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getDatabase } from '../../lib/mongodb';
import { initialDesks } from '../../data/desks';

async function getCurrentUserId() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token');

  if (!token) return null;

  try {
    const session = JSON.parse(Buffer.from(token.value, 'base64').toString());
    if (session.exp < Date.now()) return null;
    return session.id;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const userId = await getCurrentUserId();

    // Guest users can't see any desks
    if (!userId) {
      return NextResponse.json([]);
    }

    const db = await getDatabase();
    const desks = await db.collection('desks').find({ userId }).toArray();

    // If no desks exist for this user, initialize with default data
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
    const userId = await getCurrentUserId();
    const db = await getDatabase();
    const body = await request.json();

    const newDesk = {
      id: String(Date.now()),
      ...body,
      ...(userId && { userId }),
    };

    await db.collection('desks').insertOne(newDesk);
    return NextResponse.json(newDesk, { status: 201 });
  } catch (error) {
    console.error('Error creating desk:', error);
    return NextResponse.json({ error: 'Failed to create desk' }, { status: 500 });
  }
}
