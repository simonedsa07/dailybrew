import { z } from 'zod';

export const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100).trim(),
    email: z.string().email('Invalid email address').toLowerCase().trim(),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
});

export const habitSchema = z.object({
  name: z.string().min(1, 'Habit name is required').max(100).trim(),
  description: z.string().max(500).optional(),
  icon: z.string().default('☕'),
  category: z.string().min(1).max(50).default('General'),
  frequency: z.enum(['daily', 'weekdays', 'weekends', 'custom']).default('daily'),
  scheduledDays: z.array(z.number().min(0).max(6)).optional(),
  targetValue: z.number().positive().optional(),
  targetUnit: z.string().max(30).optional(),
});

export const transactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  description: z.string().min(1, 'Description is required').max(200).trim(),
  amount: z
    .number({ required_error: 'Amount is required' })
    .positive('Amount must be positive')
    .finite('Amount must be a finite number'),
  category: z.string().min(1, 'Category is required').trim(),
  transactionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  notes: z.string().max(1000).optional(),
  paymentMethod: z.string().max(50).optional(),
});

export const budgetSchema = z.object({
  overallLimit: z.number().nonnegative('Budget must be non-negative'),
  categoryLimits: z
    .array(
      z.object({
        category: z.string().min(1),
        limit: z.number().nonnegative(),
      })
    )
    .default([]),
});

export const savingsGoalSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  targetAmount: z.number().positive('Target must be positive'),
  currentAmount: z.number().nonnegative().default(0),
  targetDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD')
    .optional(),
});

export const dailyEntrySchema = z.object({
  mood: z
    .enum([
      'happy',
      'calm',
      'okay',
      'tired',
      'stressed',
      'sad',
      'lovely',
      'good',
      'low',
      'Lovely',
      'Good',
      'Okay',
      'Tired',
      'Low',
      'Happy',
      'Calm',
      'Stressed',
      'Sad',
    ])
    .transform((val) => val.toLowerCase() as 'happy' | 'calm' | 'okay' | 'tired' | 'stressed' | 'sad' | 'lovely' | 'good' | 'low')
    .optional(),
  note: z.string().max(2000).optional(),
  gratitude: z.string().max(500).optional(),
  waterIntake: z.number().nonnegative().optional(),
});

export const updatePreferencesSchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  preferences: z
    .object({
      currency: z.string().max(10).optional(),
      waterTarget: z.number().positive().max(10000).optional(),
      monthlyBudget: z.number().nonnegative().optional(),
      theme: z.enum(['default', 'dark', 'sakura']).optional(),
    })
    .optional(),
});
