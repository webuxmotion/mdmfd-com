import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import clientPromise from '../../../lib/mongodb';
import bcrypt from 'bcryptjs';
import { decryptMasterKey, encryptMasterKey } from '../../../lib/encryption.server';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db('mdmfd');
    const usersCollection = db.collection('users');

    const user = await usersCollection.findOne({
      email: session.user.email
    });

    if (!user || !user.password) {
      return NextResponse.json(
        { error: 'User not found or no password set' },
        { status: 404 }
      );
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Re-encrypt the master key with the new password
    let newEncryptedMasterKey = user.encryptedMasterKey;
    if (user.encryptedMasterKey) {
      try {
        // Decrypt master key with old password
        const masterKey = decryptMasterKey(user.encryptedMasterKey, currentPassword);
        // Re-encrypt with new password
        newEncryptedMasterKey = encryptMasterKey(masterKey, newPassword);
      } catch (error) {
        console.error('Failed to re-encrypt master key:', error);
        return NextResponse.json(
          { error: 'Failed to update encryption key' },
          { status: 500 }
        );
      }
    }

    // Update user with new password and re-encrypted master key
    await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          password: hashedNewPassword,
          encryptedMasterKey: newEncryptedMasterKey,
        }
      }
    );

    return NextResponse.json({
      success: true,
      encryptedMasterKey: newEncryptedMasterKey,
    });
  } catch (error) {
    console.error('Password change error:', error);
    return NextResponse.json(
      { error: 'Password change failed' },
      { status: 500 }
    );
  }
}
