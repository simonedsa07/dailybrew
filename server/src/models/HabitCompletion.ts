import mongoose, { Document, Schema } from 'mongoose';

export interface IHabitCompletion extends Document {
  userId: mongoose.Types.ObjectId;
  habitId: mongoose.Types.ObjectId;
  completionDate: string; // ISO date string YYYY-MM-DD
  createdAt: Date;
}

const habitCompletionSchema = new Schema<IHabitCompletion>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    habitId: { type: Schema.Types.ObjectId, ref: 'Habit', required: true },
    completionDate: { type: String, required: true }, // 'YYYY-MM-DD'
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Prevent duplicate completions for the same habit on the same date
habitCompletionSchema.index({ userId: 1, habitId: 1, completionDate: 1 }, { unique: true });
habitCompletionSchema.index({ userId: 1, completionDate: 1 });

export const HabitCompletion = mongoose.model<IHabitCompletion>('HabitCompletion', habitCompletionSchema);
