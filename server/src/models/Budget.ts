import mongoose, { Document, Schema } from 'mongoose';

export interface ICategoryLimit {
  category: string;
  limit: number;
}

export interface IBudget extends Document {
  userId: mongoose.Types.ObjectId;
  month: string; // 'YYYY-MM'
  overallLimit: number;
  categoryLimits: ICategoryLimit[];
  createdAt: Date;
  updatedAt: Date;
}

const budgetSchema = new Schema<IBudget>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    month: { type: String, required: true }, // 'YYYY-MM'
    overallLimit: { type: Number, required: true, min: 0 },
    categoryLimits: [
      {
        category: { type: String, required: true },
        limit: { type: Number, required: true, min: 0 },
      },
    ],
  },
  { timestamps: true }
);

// One budget per user per month
budgetSchema.index({ userId: 1, month: 1 }, { unique: true });

export const Budget = mongoose.model<IBudget>('Budget', budgetSchema);
