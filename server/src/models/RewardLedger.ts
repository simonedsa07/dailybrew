import mongoose, { Document, Schema } from 'mongoose';

export type RewardActionType =
  | 'habit_completion'
  | 'daily_checkin'
  | 'all_habits_bonus';

export interface IRewardLedger extends Document {
  userId: mongoose.Types.ObjectId;
  actionType: RewardActionType;
  referenceId: string; // e.g. habitCompletionId or dailyEntry date
  amount: number;
  createdAt: Date;
}

const rewardLedgerSchema = new Schema<IRewardLedger>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    actionType: {
      type: String,
      enum: ['habit_completion', 'daily_checkin', 'all_habits_bonus'],
      required: true,
    },
    referenceId: { type: String, required: true },
    amount: { type: Number, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Idempotency: one reward per action per reference
rewardLedgerSchema.index({ userId: 1, actionType: 1, referenceId: 1 }, { unique: true });

export const RewardLedger = mongoose.model<IRewardLedger>('RewardLedger', rewardLedgerSchema);
