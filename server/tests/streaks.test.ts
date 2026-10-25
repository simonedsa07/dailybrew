import { describe, it, expect, beforeAll, afterAll, afterEach } from '@jest/globals';
import request from 'supertest';
import app from '../src/app';
import { connectTestDB, closeTestDB, clearTestDB } from './testDb';
import { HabitCompletion } from '../src/models/HabitCompletion';

beforeAll(async () => {
  await connectTestDB();
});

afterAll(async () => {
  await closeTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

async function getAuthCookie(email = 'streak@example.com') {
  const regRes = await request(app).post('/api/v1/auth/register').send({
    name: 'Streak Tester',
    email,
    password: 'password123',
    confirmPassword: 'password123',
  });
  const res = await request(app).post('/api/v1/auth/login').send({
    email,
    password: 'password123',
  });
  return { cookie: res.headers['set-cookie']?.[0] || '', userId: regRes.body.data.id };
}

describe('Habit Streaks and Milestones', () => {
  it('awards +10 bonus beans when 7-day streak milestone is achieved', async () => {
    const { cookie, userId } = await getAuthCookie('streakmilestone@example.com');

    // Create a daily habit
    const createRes = await request(app)
      .post('/api/v1/habits')
      .set('Cookie', cookie)
      .send({ name: 'Reading', category: 'Mindfulness', frequency: 'daily' });

    const habitId = createRes.body.data._id;

    // Seed previous 6 days of completions
    const today = new Date();
    for (let i = 6; i >= 1; i--) {
      const d = new Date(today);
      d.setUTCDate(d.getUTCDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      await HabitCompletion.create({
        userId,
        habitId,
        completionDate: dateStr,
      });
    }

    // Now complete the 7th day (today): should trigger 5 beans (completion) + 10 beans (streak milestone)
    const todayStr = today.toISOString().slice(0, 10);
    const complete7 = await request(app)
      .post(`/api/v1/habits/${habitId}/completions`)
      .set('Cookie', cookie)
      .send({ date: todayStr });

    expect(complete7.status).toBe(201);
    expect(complete7.body.beansEarned).toBeGreaterThanOrEqual(15); // 5 (habit) + 10 (streak milestone)

    const meRes = await request(app).get('/api/v1/auth/me').set('Cookie', cookie);
    expect(meRes.body.data.beanBalance).toBeGreaterThanOrEqual(15);
  });
});
