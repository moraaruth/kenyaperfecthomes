/**
 * Creates or updates the two administrator accounts in MongoDB.
 * Passwords are typed at a hidden prompt and are never stored in code or printed.
 *
 * Usage: npm run seed:admins   (reads MONGODB_URI from .env)
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import readline from 'node:readline';
import { UserModel } from '../src/models/User';
import { hashPassword, validatePassword } from '../src/lib/userAuth';

dotenv.config();

const ADMINS = [
  { email: 'iammoraaruth@gmail.com', name: 'Ruth Moraa' },
  { email: 'mnjosiah@gmail.com', name: 'Josiah M.' },
];

function askHidden(question: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    const rlAny = rl as unknown as { _writeToOutput: (s: string) => void; muted: boolean };
    rlAny.muted = false;
    rlAny._writeToOutput = (s: string) => {
      if (!rlAny.muted) process.stdout.write(s);
    };
    process.stdout.write(question);
    rlAny.muted = true;
    rl.question('', (answer) => {
      rlAny.muted = false;
      process.stdout.write('\n');
      rl.close();
      resolve(answer);
    });
  });
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set in .env');

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  console.log('Connected to MongoDB.');

  for (const admin of ADMINS) {
    const password = await askHidden(`Password for ${admin.email}: `);
    const problem = validatePassword(password);
    if (problem) {
      throw new Error(`Password for ${admin.email} rejected: ${problem}`);
    }
    const passwordHash = await hashPassword(password);

    await UserModel.updateOne(
      { email: admin.email },
      {
        $set: { name: admin.name, passwordHash, role: 'admin', status: 'active' },
        $inc: { tokenVersion: 1 },
      },
      { upsert: true }
    );
    console.log(`Saved administrator: ${admin.email}`);
  }

  await mongoose.disconnect();
  console.log('Done.');
}

main().catch(async (err) => {
  console.error('Seed failed:', err instanceof Error ? err.message : err);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
