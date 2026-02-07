import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '../../../lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const db = await getDatabase();

    // Find the user by email
    const user = await db.collection('users').findOne({ email });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update all desks without a userId to belong to this user
    const result = await db.collection('desks').updateMany(
      { userId: { $exists: false } },
      { $set: { userId: user._id.toString() } }
    );

    return NextResponse.json({
      success: true,
      message: `Assigned ${result.modifiedCount} desks to user ${email}`,
      userId: user._id.toString(),
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({ error: 'Migration failed' }, { status: 500 });
  }
}
