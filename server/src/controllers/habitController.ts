import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/authenticate';
import { Habit } from '../models/Habit';
import { HabitCompletion } from '../models/HabitCompletion';
import { RewardLedger } from '../models/RewardLedger';
import { User } from '../models/User';
import { habitSchema } from '../validators/schemas';
import { createError } from '../middleware/errorHandler';
import { config } from '../config';
import { getTodayDate, isHabitScheduledForDate } from '../utils/dateUtils';

// ---- CRUD ----

export async function getHabits(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { active } = req.query;
    const query: Record<string, unknown> = { userId: req.userId };
    if (active === 'true') query.isActive = true;
    if (active === 'false') query.isActive = false;

    const habits = await Habit.find(query).sort({ createdAt: 1 });
    res.json({ success: true, data: habits });
  } catch (err) {
    next(err);
  }
}

export async function createHabit(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = habitSchema.parse(req.body);
    const habit = await Habit.create({ ...data, userId: req.userId });
    res.status(201).json({ success: true, data: habit });
  } catch (err) {
    next(err);
  }
}

export async function getHabit(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const habit = await Habit.findOne({ _id: req.params.id, userId: req.userId });
    if (!habit) return next(createError('Habit not found.', 404));
    res.json({ success: true, data: habit });
  } catch (err) {
    next(err);
  }
}

export async function updateHabit(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = habitSchema.partial().parse(req.body);
    const habit = await Habit.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { $set: data },
      { new: true }
    );
    if (!habit) return next(createError('Habit not found.', 404));
    res.json({ success: true, data: habit });
  } catch (err) {
    next(err);
  }
}

export async function deleteHabit(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const habit = await Habit.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!habit) return next(createError('Habit not found.', 404));
    // Keep completion history for analytics; just orphan it
    res.json({ success: true, message: 'Habit deleted.' });
  } catch (err) {
    next(err);
  }
}

// ---- COMPLETIONS ----

export async function completeHabit(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const habit = await Habit.findOne({ _id: req.params.id, userId: req.userId });
    if (!habit) return next(createError('Habit not found.', 404));
    if (!habit.isActive) return next(createError('Habit is not active.', 400));

    const date = req.body.date || getTodayDate();

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return next(createError('Date must be in YYYY-MM-DD format.', 400));
    }

    let completion;
    let isNew = false;
    try {
      completion = await HabitCompletion.create({
        userId: req.userId,
        habitId: habit._id,
        completionDate: date,
      });
      isNew = true;
    } catch (err: unknown) {
      const mongoErr = err as { code?: number };
      if (mongoErr.code === 11000) {
        // Already completed — return existing
        completion = await HabitCompletion.findOne({
          userId: req.userId,
          habitId: habit._id,
          completionDate: date,
        });
        res.json({ success: true, data: completion, alreadyCompleted: true, beansEarned: 0 });
        return;
      }
      throw err;
    }

    // Award beans — idempotent
    let beansEarned = 0;
    if (isNew) {
      beansEarned = await awardHabitCompletionBeans(req.userId!, completion._id.toString(), habit._id.toString(), date);
    }

    res.status(201).json({ success: true, data: completion, alreadyCompleted: false, beansEarned });
  } catch (err) {
    next(err);
  }
}

export async function uncompleteHabit(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { completionId } = req.params;
    const completion = await HabitCompletion.findOneAndDelete({
      _id: completionId,
      userId: req.userId,
    });
    if (!completion) return next(createError('Completion record not found.', 404));

    res.json({ success: true, message: 'Completion removed.' });
  } catch (err) {
    next(err);
  }
}

export async function getHabitHistory(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const habit = await Habit.findOne({ _id: req.params.id, userId: req.userId });
    if (!habit) return next(createError('Habit not found.', 404));

    const completions = await HabitCompletion.find({
      habitId: req.params.id,
      userId: req.userId,
    }).sort({ completionDate: -1 });

    const streak = calculateStreak(completions.map((c) => c.completionDate), habit.frequency, habit.scheduledDays);

    res.json({
      success: true,
      data: {
        completions,
        currentStreak: streak.current,
        longestStreak: streak.longest,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ---- Reward helper ----

async function awardHabitCompletionBeans(
  userId: string,
  completionId: string,
  habitId: string,
  date: string
): Promise<number> {
  const session = await mongoose.startSession();
  let beansEarned = 0;

  try {
    await session.withTransaction(async () => {
      // Check idempotency
      const existing = await RewardLedger.findOne({
        userId,
        actionType: 'habit_completion',
        referenceId: completionId,
      }).session(session);

      if (existing) return;

      const amount = config.rewards.habitCompletion;
      await RewardLedger.create(
        [{ userId, actionType: 'habit_completion', referenceId: completionId, amount }],
        { session }
      );
      await User.findByIdAndUpdate(userId, { $inc: { beanBalance: amount } }, { session });
      beansEarned += amount;

      // Check all-habits bonus
      const [allActiveHabits, todayCompletions] = await Promise.all([
        Habit.find({ userId, isActive: true }).session(session),
        HabitCompletion.find({ userId, completionDate: date }).session(session),
      ]);

      const scheduledToday = allActiveHabits.filter((h) =>
        isHabitScheduledForDate(h.frequency, h.scheduledDays, date)
      );

      if (
        scheduledToday.length > 0 &&
        scheduledToday.every((h) => todayCompletions.some((c) => c.habitId.toString() === h._id.toString()))
      ) {
        const bonusKey = `all_habits_bonus:${date}`;
        const bonusExisting = await RewardLedger.findOne({
          userId,
          actionType: 'all_habits_bonus',
          referenceId: bonusKey,
        }).session(session);

        if (!bonusExisting) {
          const bonus = config.rewards.allHabitsBonus;
          await RewardLedger.create(
            [{ userId, actionType: 'all_habits_bonus', referenceId: bonusKey, amount: bonus }],
            { session }
          );
          await User.findByIdAndUpdate(userId, { $inc: { beanBalance: bonus } }, { session });
          beansEarned += bonus;
        }
      }

      // Check 7-day streak milestone (+10 bonus beans once per habit milestone)
      const currentHabit = await Habit.findById(habitId).session(session);
      if (currentHabit) {
        const habitCompletions = await HabitCompletion.find({
          userId,
          habitId: currentHabit._id,
        }).session(session);
        const dates = habitCompletions.map((c) => c.completionDate);
        const streakInfo = calculateStreak(dates, currentHabit.frequency, currentHabit.scheduledDays);

        if (streakInfo.current >= 7) {
          const streakKey = `habit_streak_7:${currentHabit._id}`;
          const streakExisting = await RewardLedger.findOne({
            userId,
            actionType: 'streak_milestone_7',
            referenceId: streakKey,
          }).session(session);

          if (!streakExisting) {
            const streakBonus = config.rewards.streakMilestone || 10;
            await RewardLedger.create(
              [{ userId, actionType: 'streak_milestone_7', referenceId: streakKey, amount: streakBonus }],
              { session }
            );
            await User.findByIdAndUpdate(userId, { $inc: { beanBalance: streakBonus } }, { session });
            beansEarned += streakBonus;
          }
        }
      }
    });
  } finally {
    await session.endSession();
  }

  return beansEarned;
}

// ---- Streak calculation ----

export function calculateStreak(
  dates: string[],
  frequency: string,
  scheduledDays?: number[]
): { current: number; longest: number } {
  if (dates.length === 0) return { current: 0, longest: 0 };

  const sorted = [...new Set(dates)].sort((a, b) => (a < b ? -1 : 1));
  const today = getTodayDate();
  const yesterday = offsetDate(today, -1);

  let current = 0;
  let longest = 0;
  let streak = 0;
  let prev: string | null = null;

  for (let i = 0; i < sorted.length; i++) {
    const d = sorted[i];

    if (prev === null) {
      streak = 1;
    } else {
      const expected = getNextScheduledDate(prev, frequency, scheduledDays);
      if (expected === d) {
        streak++;
      } else {
        streak = 1;
      }
    }

    if (streak > longest) longest = streak;
    prev = d;
  }

  // Is the last completed date today or yesterday?
  const lastDate = sorted[sorted.length - 1];
  if (lastDate === today || lastDate === yesterday) {
    current = streak;
  } else {
    current = 0;
  }

  return { current, longest };
}

function offsetDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function getNextScheduledDate(from: string, frequency: string, scheduledDays?: number[]): string {
  if (frequency === 'daily') return offsetDate(from, 1);
  if (frequency === 'weekdays') {
    let d = offsetDate(from, 1);
    for (let i = 0; i < 7; i++) {
      const day = new Date(d + 'T00:00:00Z').getUTCDay();
      if (day >= 1 && day <= 5) return d;
      d = offsetDate(d, 1);
    }
  }
  if (frequency === 'weekends') {
    let d = offsetDate(from, 1);
    for (let i = 0; i < 7; i++) {
      const day = new Date(d + 'T00:00:00Z').getUTCDay();
      if (day === 0 || day === 6) return d;
      d = offsetDate(d, 1);
    }
  }
  if (frequency === 'custom' && scheduledDays && scheduledDays.length > 0) {
    let d = offsetDate(from, 1);
    for (let i = 0; i < 14; i++) {
      const day = new Date(d + 'T00:00:00Z').getUTCDay();
      if (scheduledDays.includes(day)) return d;
      d = offsetDate(d, 1);
    }
  }
  return offsetDate(from, 1);
}
