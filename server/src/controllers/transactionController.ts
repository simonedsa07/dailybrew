import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authenticate';
import { Transaction } from '../models/Transaction';
import { transactionSchema } from '../validators/schemas';
import { createError } from '../middleware/errorHandler';
import { getMonthStart, getMonthEnd } from '../utils/dateUtils';

export async function getTransactions(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { category, type, startDate, endDate, search, sortBy, sortOrder, page, limit } = req.query;

    const query: Record<string, unknown> = { userId: req.userId };
    if (category) query.category = category;
    if (type) query.type = type;
    if (search) query.description = { $regex: search, $options: 'i' };
    if (startDate || endDate) {
      query.transactionDate = {};
      if (startDate) (query.transactionDate as Record<string, unknown>).$gte = startDate;
      if (endDate) (query.transactionDate as Record<string, unknown>).$lte = endDate;
    }

    const pageNum = Math.max(1, parseInt(String(page || '1'), 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(String(limit || '50'), 10)));
    const skip = (pageNum - 1) * limitNum;

    const sort: Record<string, 1 | -1> = {};
    const validSortFields = ['transactionDate', 'amount', 'createdAt'];
    const sortField = validSortFields.includes(String(sortBy)) ? String(sortBy) : 'transactionDate';
    sort[sortField] = sortOrder === 'asc' ? 1 : -1;

    const [transactions, total] = await Promise.all([
      Transaction.find(query).sort(sort).skip(skip).limit(limitNum),
      Transaction.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: transactions,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    next(err);
  }
}

export async function createTransaction(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = transactionSchema.parse(req.body);
    const transaction = await Transaction.create({ ...data, userId: req.userId });
    res.status(201).json({ success: true, data: transaction });
  } catch (err) {
    next(err);
  }
}

export async function getTransaction(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const transaction = await Transaction.findOne({ _id: req.params.id, userId: req.userId });
    if (!transaction) return next(createError('Transaction not found.', 404));
    res.json({ success: true, data: transaction });
  } catch (err) {
    next(err);
  }
}

export async function updateTransaction(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = transactionSchema.partial().parse(req.body);
    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { $set: data },
      { new: true }
    );
    if (!transaction) return next(createError('Transaction not found.', 404));
    res.json({ success: true, data: transaction });
  } catch (err) {
    next(err);
  }
}

export async function deleteTransaction(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const transaction = await Transaction.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!transaction) return next(createError('Transaction not found.', 404));
    res.json({ success: true, message: 'Transaction deleted.' });
  } catch (err) {
    next(err);
  }
}

export async function getMonthSummary(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const month = String(req.query.month || new Date().toISOString().slice(0, 7));
    if (!/^\d{4}-\d{2}$/.test(month)) return next(createError('Month must be YYYY-MM.', 400));

    const start = getMonthStart(month);
    const end = getMonthEnd(month);

    const transactions = await Transaction.find({
      userId: req.userId,
      transactionDate: { $gte: start, $lte: end },
    });

    let totalIncome = 0;
    let totalExpenses = 0;
    const categoryTotals: Record<string, number> = {};

    for (const t of transactions) {
      if (t.type === 'income') {
        totalIncome += t.amount;
      } else {
        totalExpenses += t.amount;
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
      }
    }

    res.json({
      success: true,
      data: {
        month,
        totalIncome,
        totalExpenses,
        net: totalIncome - totalExpenses,
        categoryTotals,
        transactionCount: transactions.length,
      },
    });
  } catch (err) {
    next(err);
  }
}
