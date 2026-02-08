import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '../../../lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('mdmfd');

    const user = await db.collection('users').findOne({ email });

    if (!user) {
      return NextResponse.json(
        { error: 'No account found with this email' },
        { status: 404 }
      );
    }

    // Check if user has recovery key set up
    const hasRecoveryKey = !!(user.recoveryKeyHash && user.recoveryEncryptedMasterKey);

    return NextResponse.json({
      hasRecoveryKey,
    });
  } catch (error) {
    console.error('Check recovery error:', error);
    return NextResponse.json(
      { error: 'Failed to check recovery status' },
      { status: 500 }
    );
  }
}
