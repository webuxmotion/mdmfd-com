import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '../../../lib/mongodb';
import bcrypt from 'bcryptjs';
import { generateMasterKey, encryptMasterKey } from '../../../lib/encryption.server';

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
    const db = client.db('mdmfd');
    const usersCollection = db.collection('users');

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

    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate and encrypt master key for end-to-end encryption
    const masterKey = generateMasterKey();
    const encryptedMasterKey = encryptMasterKey(masterKey, password);

    const newUser = {
      username,
      fullName,
      email,
      password: hashedPassword,
      encryptedMasterKey,
      phone: '',
      avatar: '',
      link: `https://mdmfd.com/${username}`,
      createdAt: new Date(),
    };

    const result = await usersCollection.insertOne(newUser);

    return NextResponse.json({
      success: true,
      userId: result.insertedId.toString(),
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}
