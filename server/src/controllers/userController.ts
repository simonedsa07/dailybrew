import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authenticate';
import { User } from '../models/User';
import { updatePreferencesSchema } from '../validators/schemas';
import { createError } from '../middleware/errorHandler';

export async function getProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await User.findById(req.userId);
    if (!user) return next(createError('User not found.', 404));

    res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        beanBalance: user.beanBalance,
        preferences: user.preferences,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = updatePreferencesSchema.parse(req.body);

    const updateFields: Record<string, unknown> = {};
    if (data.name) updateFields.name = data.name;
    if (data.preferences) {
      const prefs = data.preferences;
      if (prefs.currency !== undefined) updateFields['preferences.currency'] = prefs.currency;
      if (prefs.waterTarget !== undefined) updateFields['preferences.waterTarget'] = prefs.waterTarget;
      if (prefs.monthlyBudget !== undefined) updateFields['preferences.monthlyBudget'] = prefs.monthlyBudget;
      if (prefs.theme !== undefined) updateFields['preferences.theme'] = prefs.theme;
    }

    const user = await User.findByIdAndUpdate(req.userId, { $set: updateFields }, { new: true });
    if (!user) return next(createError('User not found.', 404));

    res.json({
      success: true,
      message: 'Profile updated.',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        beanBalance: user.beanBalance,
        preferences: user.preferences,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteAccount(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { User: UserModel } = await import('../models/User');
    const { Habit } = await import('../models/Habit');
    const { HabitCompletion } = await import('../models/HabitCompletion');
    const { Transaction } = await import('../models/Transaction');
    const { Budget } = await import('../models/Budget');
    const { SavingsGoal } = await import('../models/SavingsGoal');
    const { DailyEntry } = await import('../models/DailyEntry');
    const { CafeLayout } = await import('../models/CafeLayout');
    const { RewardLedger } = await import('../models/RewardLedger');

    const userId = req.userId;

    await Promise.all([
      Habit.deleteMany({ userId }),
      HabitCompletion.deleteMany({ userId }),
      Transaction.deleteMany({ userId }),
      Budget.deleteMany({ userId }),
      SavingsGoal.deleteMany({ userId }),
      DailyEntry.deleteMany({ userId }),
      CafeLayout.deleteMany({ userId }),
      RewardLedger.deleteMany({ userId }),
      UserModel.findByIdAndDelete(userId),
    ]);

    res.clearCookie('token');
    res.json({ success: true, message: 'Account and all associated data deleted.' });
  } catch (err) {
    next(err);
  }
}
