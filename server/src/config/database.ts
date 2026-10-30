import mongoose from 'mongoose';
import dns from 'dns';
import { config } from './index';
import { DailyEntry } from '../models/DailyEntry';

export async function migrateDailyEntryIndexes(): Promise<void> {
  const db = mongoose.connection.db;
  if (!db) throw new Error('MongoDB connection is not available for journal index migration.');

  const collectionExists = await db
    .listCollections({ name: DailyEntry.collection.collectionName }, { nameOnly: true })
    .hasNext();
  if (!collectionExists) return;

  const indexes = await DailyEntry.collection.indexes();
  const legacyIndex = indexes.find(
    (index) =>
      index.unique &&
      Object.keys(index.key ?? {}).join(',') === 'userId,date'
  );
  if (legacyIndex?.name) {
    await DailyEntry.collection.dropIndex(legacyIndex.name);
    console.log('✅ Updated journal index to allow multiple entries per day');
  }
}

export async function connectDB(): Promise<void> {
  try {
    await mongoose.connect(config.mongoUri);
    await migrateDailyEntryIndexes();
    console.log('✅ MongoDB connected successfully');
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    if (errorMsg.includes('querySrv') || errorMsg.includes('ECONNREFUSED')) {
      console.warn('⚠️  Default DNS SRV lookup failed. Retrying with fallback DNS servers (8.8.8.8, 1.1.1.1)...');
      try {
        dns.setServers(['8.8.8.8', '1.1.1.1']);
        await mongoose.connect(config.mongoUri);
        await migrateDailyEntryIndexes();
        console.log('✅ MongoDB connected successfully via fallback DNS');
        return;
      } catch (retryErr) {
        console.error('❌ MongoDB connection error with fallback DNS:', retryErr);
        throw retryErr;
      }
    }
    console.error('❌ MongoDB connection error:', err);
    throw err;
  }
}

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('🔄 MongoDB reconnected');
});
