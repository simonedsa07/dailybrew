import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authenticate';
import { Budget } from '../models/Budget';
import { SavingsGoal } from '../models/SavingsGoal';
import { budgetSchema, savingsGoalSchema } from '../validators/schemas';
import { createError } from '../middleware/errorHandler';

// ---- Budgets ----

export async function getBudgets(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const budgets = await Budget.find({ userId: req.userId }).sort({ month: -1 });
    res.json({ success: true, data: budgets });
  } catch (err) {
    next(err);
  }
}

export async function upsertBudget(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const month = req.params.month;
    if (typeof month !== 'string' || !/^\d{4}-\d{2}$/.test(month)) return next(createError('Month must be YYYY-MM.', 400));

    const data = budgetSchema.parse(req.body);
    const budget = await Budget.findOneAndUpdate(
      { userId: req.userId, month },
      { $set: { overallLimit: data.overallLimit, categoryLimits: data.categoryLimits } },
      { upsert: true, new: true }
    );

    res.json({ success: true, data: budget });
  } catch (err) {
    next(err);
  }
}

export async function deleteBudget(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const month = req.params.month

    if (typeof month !== 'string' || !/^\d{4}-\d{2}$/.test(month)) {
      return next(createError('Month must be YYYY-MM.', 400))
    }

    await Budget.findOneAndDelete({
      userId: req.userId,
      month,
    })

    res.json({ success: true, message: 'Monthly budget cleared.' })
  } catch (err) {
    next(err)
  }
}
// ---- Savings Goals ----

export async function getSavingsGoals(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const goals = await SavingsGoal.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json({ success: true, data: goals });
  } catch (err) {
    next(err);
  }
}

export async function createSavingsGoal(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = savingsGoalSchema.parse(req.body);
    const goal = await SavingsGoal.create({ ...data, userId: req.userId });
    res.status(201).json({ success: true, data: goal });
  } catch (err) {
    next(err);
  }
}

export async function updateSavingsGoal(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = savingsGoalSchema.partial().parse(req.body);
    const goal = await SavingsGoal.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { $set: data },
      { new: true }
    );
    if (!goal) return next(createError('Savings goal not found.', 404));
    res.json({ success: true, data: goal });
  } catch (err) {
    next(err);
  }
}

export async function deleteSavingsGoal(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const goal = await SavingsGoal.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!goal) return next(createError('Savings goal not found.', 404));
    res.json({ success: true, message: 'Savings goal deleted.' });
  } catch (err) {
    next(err);
  }
}


