import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '../../../lib/mongodb';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { username, fullName, email, password } = await request.json();

    if (!username || !fullName || !email || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();
    const usersCollection = db.collection('users');

    // Check if user already exists
    const existingUser = await usersCollection.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return NextResponse.json(
          { error: 'Email already registered' },
          { status: 400 }
        );
      }
      if (existingUser.username === username) {
        return NextResponse.json(
          { error: 'Username already taken' },
          { status: 400 }
        );
      }
    }

    // Create user (in production, hash the password!)
    const newUser = {
      username,
      fullName,
      email,
      password, // TODO: Hash password in production
      phone: '',
      avatar: '',
      link: `https://mdmfd.com/${username}`,
      createdAt: new Date(),
    };

    const result = await usersCollection.insertOne(newUser);

    // Create session token (simple implementation)
    const sessionToken = Buffer.from(JSON.stringify({
      id: result.insertedId.toString(),
      email,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
    })).toString('base64');

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set('auth_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    // Return user without password
    const { password: _, ...userWithoutPassword } = newUser;

    return NextResponse.json({
      user: {
        id: result.insertedId.toString(),
        ...userWithoutPassword,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}
