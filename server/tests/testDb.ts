import mongoose from 'mongoose';
import { config } from '../src/config';

// Use a test database
const TEST_DB_URI = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/daily-brew-test';

export async function connectTestDB() {
  await mongoose.connect(TEST_DB_URI);
}

export async function closeTestDB() {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
}

export async function clearTestDB() {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}
