import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User';

dotenv.config();

async function run() {
  const MONGO = process.env.MONGO_URI!;
  if (!MONGO) throw new Error('MONGO_URI missing');
  await mongoose.connect(MONGO);

  const email = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.SEED_ADMIN_PASS || 'ChangeMe123!';
  const exists = await User.findOne({ email });
  if (exists) {
    console.log('Admin already exists:', email);
    process.exit(0);
  }
  const u = new User({ email, password, role: 'admin' });
  await u.save();
  console.log('Admin created:', email);
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });