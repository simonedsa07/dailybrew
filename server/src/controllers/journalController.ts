import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/authenticate';
import { DailyEntry } from '../models/DailyEntry';
import { RewardLedger } from '../models/RewardLedger';
import { User } from '../models/User';
import { dailyEntrySchema } from '../validators/schemas';
import { createError } from '../middleware/errorHandler';
import { config } from '../config';

export async function getDailyEntries(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { startDate, endDate } = req.query;
    const query: Record<string, unknown> = { userId: req.userId };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) (query.date as Record<string, unknown>).$gte = startDate;
      if (endDate) (query.date as Record<string, unknown>).$lte = endDate;
    }

    const entries = await DailyEntry.find(query).sort({ date: -1, createdAt: -1 }).limit(90);
    res.json({ success: true, data: entries });
  } catch (err) {
    next(err);
  }
}

export async function getDailyEntry(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const date = req.params.date;
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return next(createError('Date must be YYYY-MM-DD.', 400));

    const entry = await DailyEntry.findOne({ userId: req.userId, date }).sort({ createdAt: -1 });
    res.json({ success: true, data: entry || null });
  } catch (err) {
    next(err);
  }
}

export async function createDailyEntry(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const date = req.params.date;
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return next(createError('Date must be YYYY-MM-DD.', 400));

    const data = dailyEntrySchema.parse(req.body);
    const entry = await DailyEntry.create({ ...data, userId: req.userId, date });
    const beansEarned = await awardEligibleCheckIn(req.userId!, date, data);

    res.status(201).json({ success: true, data: entry, beansEarned });
  } catch (err) {
    next(err);
  }
}

export async function upsertDailyEntry(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const date = req.params.date;
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return next(createError('Date must be YYYY-MM-DD.', 400));

    const data = dailyEntrySchema.parse(req.body);

    const entry = await DailyEntry.findOneAndUpdate(
      { userId: req.userId, date },
      { $set: data },
      { upsert: true, new: true }
    );

    const beansEarned = await awardEligibleCheckIn(req.userId!, date, data);

    res.json({ success: true, data: entry, beansEarned });
  } catch (err) {
    next(err);
  }
}

async function awardEligibleCheckIn(
  userId: string,
  date: string,
  data: { mood?: string; note?: string; gratitude?: string }
): Promise<number> {
  if (!data.mood && !data.note?.trim() && !data.gratitude?.trim()) return 0;
  return awardCheckInBeans(userId, date);
}

async function awardCheckInBeans(userId: string, date: string): Promise<number> {
  const session = await mongoose.startSession();
  let beans = 0;
  try {
    await session.withTransaction(async () => {
      const refId = `checkin:${date}`;
      const existing = await RewardLedger.findOne({
        userId,
        actionType: 'daily_checkin',
        referenceId: refId,
      }).session(session);

      if (existing) return;

      const amount = config.rewards.dailyCheckIn;
      await RewardLedger.create(
        [{ userId, actionType: 'daily_checkin', referenceId: refId, amount }],
        { session }
      );
      await User.findByIdAndUpdate(userId, { $inc: { beanBalance: amount } }, { session });
      beans = amount;
    });
  } finally {
    await session.endSession();
  }
  return beans;
}
