import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import clientPromise from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token');

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Decode token
    let session;
    try {
      session = JSON.parse(Buffer.from(token.value, 'base64').toString());
    } catch {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Check expiration
    if (session.exp < Date.now()) {
      cookieStore.delete('auth_token');
      return NextResponse.json(
        { error: 'Session expired' },
        { status: 401 }
      );
    }

    // Get user from database
    const client = await clientPromise;
    const db = client.db();
    const usersCollection = db.collection('users');

    const user = await usersCollection.findOne({ _id: new ObjectId(session.id) });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      );
    }

    // Return user without password
    const { password: _, _id, ...userWithoutPassword } = user;

    return NextResponse.json({
      user: {
        id: _id.toString(),
        ...userWithoutPassword,
      },
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { error: 'Authentication check failed' },
      { status: 500 }
    );
  }
}
