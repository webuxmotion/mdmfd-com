import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import clientPromise from '../../../lib/mongodb';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const client = await clientPromise;
    const db = client.db('mdmfd');
    const user = await db.collection('users').findOne({
      email: session.user.email
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const { password: _, _id, ...userWithoutPassword } = user;

    return NextResponse.json({
      user: {
        id: _id.toString(),
        ...userWithoutPassword,
      },
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const updates = await request.json();
    const { fullName, username, email, phone } = updates;

    const client = await clientPromise;
    const db = client.db('mdmfd');
    const usersCollection = db.collection('users');

    const currentUser = await usersCollection.findOne({
      email: session.user.email
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (username || email) {
      const existingUser = await usersCollection.findOne({
        _id: { $ne: currentUser._id },
        $or: [
          ...(username ? [{ username }] : []),
          ...(email ? [{ email }] : []),
        ],
      });

      if (existingUser) {
        if (existingUser.username === username) {
          return NextResponse.json(
            { error: 'Username already taken' },
            { status: 400 }
          );
        }
        if (existingUser.email === email) {
          return NextResponse.json(
            { error: 'Email already registered' },
            { status: 400 }
          );
        }
      }
    }

    const updateData: Record<string, string> = {};
    if (fullName !== undefined) updateData.fullName = fullName;
    if (username !== undefined) {
      updateData.username = username;
      updateData.link = `https://mdmfd.com/${username}`;
    }
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;

    await usersCollection.updateOne(
      { _id: currentUser._id },
      { $set: updateData }
    );

    const user = await usersCollection.findOne({ _id: currentUser._id });
    const { password: _, _id, ...userWithoutPassword } = user!;

    return NextResponse.json({
      user: {
        id: _id.toString(),
        ...userWithoutPassword,
      },
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Profile update failed' },
      { status: 500 }
    );
  }
}
