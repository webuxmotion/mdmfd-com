/**
 * One-time migration script to hash existing plain text passwords
 * Run with: npx tsx scripts/migrate-passwords.ts
 */

import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

async function migratePasswords() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not set. Please set the environment variable.');
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('mdmfd');
    const users = db.collection('users');

    // Find all users with passwords that don't look like bcrypt hashes
    // Bcrypt hashes start with $2a$, $2b$, or $2y$
    const cursor = users.find({
      password: { $exists: true, $not: /^\$2[aby]\$/ }
    });

    let count = 0;

    for await (const user of cursor) {
      if (user.password && !user.password.startsWith('$2')) {
        const hashedPassword = await bcrypt.hash(user.password, 12);

        await users.updateOne(
          { _id: user._id },
          { $set: { password: hashedPassword } }
        );

        console.log(`Migrated password for user: ${user.email}`);
        count++;
      }
    }

    console.log(`\nMigration complete. ${count} password(s) hashed.`);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

migratePasswords();
