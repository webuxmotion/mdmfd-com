import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import clientPromise from '../../../lib/mongodb';
import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';
import {
  generateMasterKey,
  encryptMasterKey,
  generateRecoveryKey,
  hashRecoveryKey,
  encryptMasterKeyWithRecovery,
} from '../../../lib/encryption.server';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { password } = await request.json();

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('mdmfd');
    const usersCollection = db.collection('users');

    // Find the user - try by _id first (from session), then by email
    let user = null;
    try {
      user = await usersCollection.findOne({ _id: new ObjectId(session.user.id) });
    } catch {
      // Invalid ObjectId format, try email
    }
    if (!user) {
      user = await usersCollection.findOne({ email: session.user.email });
    }

    // If user not found in our users collection, create them (OAuth user first time)
    if (!user) {
      console.log('Setup encryption: Creating user for OAuth user', {
        userId: session.user.id,
        email: session.user.email,
      });

      // Generate username from email
      const baseUsername = session.user.email?.split('@')[0] || 'user';
      let username = baseUsername.toLowerCase().replace(/[^a-z0-9._]/g, '');

      let counter = 1;
      while (await usersCollection.findOne({ username })) {
        username = `${baseUsername}${counter}`;
        counter++;
      }

      // Create the user
      const newUser = {
        _id: new ObjectId(session.user.id),
        email: session.user.email,
        fullName: session.user.name || '',
        username,
        avatar: session.user.image || '',
        link: `https://mdmfd.com/${username}`,
        phone: '',
        createdAt: new Date(),
      };

      await usersCollection.insertOne(newUser);
      user = newUser;
    }

    // Check if user already has encryption set up
    if ('encryptedMasterKey' in user && user.encryptedMasterKey) {
      return NextResponse.json(
        { error: 'Encryption already set up' },
        { status: 400 }
      );
    }

    // Hash the password for storage (OAuth users can use this for encryption)
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate master key and recovery key for end-to-end encryption
    const masterKey = generateMasterKey();
    const encryptedMasterKey = encryptMasterKey(masterKey, password);

    // Generate recovery key and encrypt master key with it
    const recoveryKey = generateRecoveryKey();
    const recoveryKeyHash = hashRecoveryKey(recoveryKey);
    const recoveryEncryptedMasterKey = encryptMasterKeyWithRecovery(masterKey, recoveryKey);

    // Update user with encryption keys and password
    await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          password: hashedPassword,
          encryptedMasterKey,
          recoveryKeyHash,
          recoveryEncryptedMasterKey,
        }
      }
    );

    return NextResponse.json({
      success: true,
      encryptedMasterKey,
      recoveryKey, // Show this once to the user
    });
  } catch (error) {
    console.error('Setup encryption error:', error);
    return NextResponse.json(
      { error: 'Failed to setup encryption' },
      { status: 500 }
    );
  }
}
