import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authenticate';
import { Habit } from '../models/Habit';
import { HabitCompletion } from '../models/HabitCompletion';
import { Transaction } from '../models/Transaction';
import { Budget } from '../models/Budget';
import { DailyEntry } from '../models/DailyEntry';
import { User } from '../models/User';
import { getTodayDate, getCurrentMonth, getMonthStart, getMonthEnd, isHabitScheduledForDate } from '../utils/dateUtils';
import { createError } from '../middleware/errorHandler';

export async function getDashboardSummary(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const today = getTodayDate();
    const month = getCurrentMonth();
    const monthStart = getMonthStart(month);
    const monthEnd = getMonthEnd(month);

    const [
      user,
      habits,
      todayCompletions,
      monthTransactions,
      currentBudget,
      todayEntry,
    ] = await Promise.all([
      User.findById(req.userId),
      Habit.find({ userId: req.userId, isActive: true }),
      HabitCompletion.find({ userId: req.userId, completionDate: today }),
      Transaction.find({
        userId: req.userId,
        transactionDate: { $gte: monthStart, $lte: monthEnd },
      }),
      Budget.findOne({ userId: req.userId, month }),
      DailyEntry.findOne({ userId: req.userId, date: today }),
    ]);

    if (!user) return next(createError('User not found.', 404));

    // Habits scheduled for today
    const scheduledToday = habits.filter((h) =>
      isHabitScheduledForDate(h.frequency, h.scheduledDays, today)
    );
    const completedTodayIds = new Set(todayCompletions.map((c) => c.habitId.toString()));
    const completedToday = scheduledToday.filter((h) => completedTodayIds.has(h._id.toString()));

    // Calculate streaks for each habit
    const habitSummary = await Promise.all(
      habits.map(async (habit) => {
        const completions = await HabitCompletion.find({
          habitId: habit._id,
          userId: req.userId,
        }).sort({ completionDate: -1 }).limit(60);

        const dates = completions.map((c) => c.completionDate);
        let streak = 0;
        const sorted = [...dates].sort((a, b) => (a > b ? -1 : 1));
        const todayStr = today;
        const yesterday = new Date(todayStr);
        yesterday.setUTCDate(yesterday.getUTCDate() - 1);
        const yesterdayStr = yesterday.toISOString().slice(0, 10);

        if (sorted[0] === todayStr || sorted[0] === yesterdayStr) {
          streak = 1;
          for (let i = 1; i < sorted.length; i++) {
            const prev = new Date(sorted[i - 1] + 'T00:00:00Z');
            const curr = new Date(sorted[i] + 'T00:00:00Z');
            const diffDays = Math.round((prev.getTime() - curr.getTime()) / 86400000);
            if (diffDays === 1) streak++;
            else break;
          }
        }

        return {
          _id: habit._id,
          name: habit.name,
          icon: habit.icon,
          category: habit.category,
          frequency: habit.frequency,
          isActive: habit.isActive,
          isScheduledToday: isHabitScheduledForDate(habit.frequency, habit.scheduledDays, today),
          isCompletedToday: completedTodayIds.has(habit._id.toString()),
          completionId: todayCompletions.find((c) => c.habitId.toString() === habit._id.toString())?._id,
          currentStreak: streak,
        };
      })
    );

    // Finance
    let totalExpenses = 0;
    let totalIncome = 0;
    const categoryTotals: Record<string, number> = {};

    for (const t of monthTransactions) {
      if (t.type === 'expense') {
        totalExpenses += t.amount;
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
      } else {
        totalIncome += t.amount;
      }
    }

    const recentTransactions = monthTransactions
      .sort((a, b) => (a.transactionDate < b.transactionDate ? 1 : -1))
      .slice(0, 5);

    res.json({
      success: true,
      data: {
        user: {
          name: user.name,
          beanBalance: user.beanBalance,
          preferences: user.preferences,
        },
        habits: {
          all: habitSummary,
          scheduledToday: scheduledToday.length,
          completedToday: completedToday.length,
        },
        finance: {
          month,
          totalExpenses,
          totalIncome,
          net: totalIncome - totalExpenses,
          categoryTotals,
          overallBudget: currentBudget?.overallLimit ?? null,
          remainingBudget: currentBudget ? currentBudget.overallLimit - totalExpenses : null,
          recentTransactions,
        },
        journal: todayEntry
          ? {
              mood: todayEntry.mood,
              note: todayEntry.note,
              waterIntake: todayEntry.waterIntake,
              gratitude: todayEntry.gratitude,
            }
          : null,
        today,
      },
    });
  } catch (err) {
    next(err);
  }
}
