import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import clientPromise from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export async function PUT(request: NextRequest) {
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

    const updates = await request.json();
    const { fullName, username, email, phone } = updates;

    const client = await clientPromise;
    const db = client.db();
    const usersCollection = db.collection('users');

    // Check if username or email is already taken by another user
    if (username || email) {
      const existingUser = await usersCollection.findOne({
        _id: { $ne: new ObjectId(session.id) },
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

    // Update user
    const updateData: Record<string, string> = {};
    if (fullName !== undefined) updateData.fullName = fullName;
    if (username !== undefined) {
      updateData.username = username;
      updateData.link = `https://mdmfd.com/${username}`;
    }
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;

    await usersCollection.updateOne(
      { _id: new ObjectId(session.id) },
      { $set: updateData }
    );

    // Get updated user
    const user = await usersCollection.findOne({ _id: new ObjectId(session.id) });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
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
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Profile update failed' },
      { status: 500 }
    );
  }
}
