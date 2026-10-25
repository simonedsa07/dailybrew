import { describe, it, expect, beforeAll, afterAll, afterEach } from '@jest/globals';
import request from 'supertest';
import app from '../src/app';
import { connectTestDB, closeTestDB } from './testDb';
import { User } from '../src/models/User';
import { DailyEntry } from '../src/models/DailyEntry';
import { RewardLedger } from '../src/models/RewardLedger';

beforeAll(async () => {
  await connectTestDB();
});

afterAll(async () => {
  await closeTestDB();
});

afterEach(async () => {
  await User.deleteMany({});
  await DailyEntry.deleteMany({});
  await RewardLedger.deleteMany({});
});

async function registerAndLogin(email = 'journaler@example.com') {
  await request(app).post('/api/v1/auth/register').send({
    name: 'Journal Tester',
    email,
    password: 'password123',
    confirmPassword: 'password123',
  });
  const loginRes = await request(app).post('/api/v1/auth/login').send({
    email,
    password: 'password123',
  });
  return loginRes.headers['set-cookie']?.[0] || '';
}

describe('Daily Journal Rewards and Persistence', () => {
  it('awards 5 beans on first eligible mood check-in of the day', async () => {
    const cookie = await registerAndLogin();
    const today = new Date().toISOString().slice(0, 10);

    const res = await request(app)
      .put(`/api/v1/daily-entries/${today}`)
      .set('Cookie', cookie)
      .send({
        mood: 'happy',
        note: 'Feeling peaceful today.',
        waterIntake: 4,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.beansEarned).toBe(5);
    expect(res.body.data.mood).toBe('happy');
    expect(res.body.data.note).toBe('Feeling peaceful today.');
    expect(res.body.data.waterIntake).toBe(4);

    const meRes = await request(app).get('/api/v1/auth/me').set('Cookie', cookie);
    expect(meRes.body.data.beanBalance).toBe(5);
  });

  it('prevents duplicate rewards when journal entry is edited or resaved repeatedly', async () => {
    const cookie = await registerAndLogin();
    const today = new Date().toISOString().slice(0, 10);

    // First save: awards 5 beans
    const res1 = await request(app)
      .put(`/api/v1/daily-entries/${today}`)
      .set('Cookie', cookie)
      .send({
        mood: 'calm',
        note: 'First note',
      });
    expect(res1.body.beansEarned).toBe(5);

    // Edit/resave note on same day: should award 0 beans
    const res2 = await request(app)
      .put(`/api/v1/daily-entries/${today}`)
      .set('Cookie', cookie)
      .send({
        mood: 'calm',
        note: 'Updated note with more gentle reflections',
      });
    expect(res2.body.beansEarned).toBe(0);

    // Verify balance was only incremented once
    const meRes = await request(app).get('/api/v1/auth/me').set('Cookie', cookie);
    expect(meRes.body.data.beanBalance).toBe(5);
  });

  it('unsupported water tracking does not produce rewards', async () => {
    const cookie = await registerAndLogin();
    const today = new Date().toISOString().slice(0, 10);

    // Logging only water with no mood does not award check-in beans
    const res = await request(app)
      .put(`/api/v1/daily-entries/${today}`)
      .set('Cookie', cookie)
      .send({
        waterIntake: 8,
      });

    expect(res.status).toBe(200);
    expect(res.body.beansEarned).toBe(0);

    const meRes = await request(app).get('/api/v1/auth/me').set('Cookie', cookie);
    expect(meRes.body.data.beanBalance).toBe(0);
  });
});
