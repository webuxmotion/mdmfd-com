import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '../../../lib/mongodb';
import bcrypt from 'bcryptjs';
import {
  hashRecoveryKey,
  decryptMasterKey,
  encryptMasterKey,
} from '../../../lib/encryption.server';

export async function POST(request: NextRequest) {
  try {
    const { email, recoveryKey, newPassword } = await request.json();

    if (!email || !recoveryKey || !newPassword) {
      return NextResponse.json(
        { error: 'Email, recovery key, and new password are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
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

    if (!user.recoveryKeyHash || !user.recoveryEncryptedMasterKey) {
      return NextResponse.json(
        { error: 'This account does not have recovery enabled' },
        { status: 400 }
      );
    }

    // Normalize and hash the provided recovery key
    const normalizedRecoveryKey = recoveryKey.replace(/-/g, '').toUpperCase();
    const providedHash = hashRecoveryKey(normalizedRecoveryKey);

    // Verify recovery key
    if (providedHash !== user.recoveryKeyHash) {
      return NextResponse.json(
        { error: 'Invalid recovery key' },
        { status: 400 }
      );
    }

    // Decrypt master key using recovery key
    let masterKey: string;
    try {
      masterKey = decryptMasterKey(user.recoveryEncryptedMasterKey, normalizedRecoveryKey);
    } catch {
      return NextResponse.json(
        { error: 'Failed to decrypt with recovery key' },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Re-encrypt master key with new password
    const encryptedMasterKey = encryptMasterKey(masterKey, newPassword);

    // Update user with new password and re-encrypted master key
    await db.collection('users').updateOne(
      { _id: user._id },
      {
        $set: {
          password: hashedPassword,
          encryptedMasterKey,
        }
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: 'Password reset failed' },
      { status: 500 }
    );
  }
}
