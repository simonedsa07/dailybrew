import mongoose, { Document, Schema } from 'mongoose';

export type TransactionType = 'income' | 'expense';

export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId;
  type: TransactionType;
  description: string;
  amount: number; // stored in whole currency units (INR)
  category: string;
  transactionDate: string; // 'YYYY-MM-DD'
  notes?: string;
  paymentMethod?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EXPENSE_CATEGORIES = [
  'Food & Drinks',
  'Transport',
  'Shopping',
  'Education',
  'Entertainment',
  'Bills',
  'Health & Personal Care',
  'Other',
];

const transactionSchema = new Schema<ITransaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['income', 'expense'], required: true },
    description: { type: String, required: true, trim: true, maxlength: 200 },
    amount: { type: Number, required: true, min: 0.01 },
    category: { type: String, required: true, trim: true },
    transactionDate: { type: String, required: true }, // 'YYYY-MM-DD'
    notes: { type: String, trim: true, maxlength: 1000 },
    paymentMethod: { type: String, trim: true },
  },
  { timestamps: true }
);

transactionSchema.index({ userId: 1, transactionDate: -1 });
transactionSchema.index({ userId: 1, type: 1 });
transactionSchema.index({ userId: 1, category: 1 });

export { EXPENSE_CATEGORIES };
export const Transaction = mongoose.model<ITransaction>('Transaction', transactionSchema);
