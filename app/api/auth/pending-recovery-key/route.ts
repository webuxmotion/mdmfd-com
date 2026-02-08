import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import clientPromise from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const client = await clientPromise;
    const db = client.db('mdmfd');

    // Find pending recovery key for this user
    const pending = await db.collection('pendingRecoveryKeys').findOne({
      userId: new ObjectId(session.user.id),
      expiresAt: { $gt: new Date() },
    });

    if (!pending) {
      return NextResponse.json({ recoveryKey: null });
    }

    return NextResponse.json({ recoveryKey: pending.recoveryKey });
  } catch (error) {
    console.error('Error fetching pending recovery key:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recovery key' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const client = await clientPromise;
    const db = client.db('mdmfd');

    // Delete pending recovery key for this user
    await db.collection('pendingRecoveryKeys').deleteMany({
      userId: new ObjectId(session.user.id),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting pending recovery key:', error);
    return NextResponse.json(
      { error: 'Failed to delete recovery key' },
      { status: 500 }
    );
  }
}
