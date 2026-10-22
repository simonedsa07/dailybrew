import { describe, it, expect, beforeAll, afterAll, afterEach } from '@jest/globals';
import request from 'supertest';
import app from '../src/app';
import { connectTestDB, closeTestDB, clearTestDB } from './testDb';

beforeAll(async () => { await connectTestDB(); });
afterAll(async () => { await closeTestDB(); });
afterEach(async () => { await clearTestDB(); });

async function getAuthCookie() {
  await request(app).post('/api/v1/auth/register').send({
    name: 'Habit Tester',
    email: 'habit@example.com',
    password: 'password123',
    confirmPassword: 'password123',
  });
  const res = await request(app).post('/api/v1/auth/login').send({
    email: 'habit@example.com',
    password: 'password123',
  });
  return res.headers['set-cookie']?.[0] || '';
}

describe('Habit CRUD', () => {
  it('creates and retrieves a habit', async () => {
    const cookie = await getAuthCookie();
    const createRes = await request(app)
      .post('/api/v1/habits')
      .set('Cookie', cookie)
      .send({ name: 'Morning Run', category: 'Health', frequency: 'daily', icon: '🏃' });

    expect(createRes.status).toBe(201);
    const id = createRes.body.data._id;

    const getRes = await request(app).get(`/api/v1/habits/${id}`).set('Cookie', cookie);
    expect(getRes.status).toBe(200);
    expect(getRes.body.data.name).toBe('Morning Run');
  });

  it('updates a habit', async () => {
    const cookie = await getAuthCookie();
    const createRes = await request(app)
      .post('/api/v1/habits')
      .set('Cookie', cookie)
      .send({ name: 'Old Name', category: 'Health', frequency: 'daily' });

    const id = createRes.body.data._id;
    const updateRes = await request(app)
      .patch(`/api/v1/habits/${id}`)
      .set('Cookie', cookie)
      .send({ name: 'New Name' });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.name).toBe('New Name');
  });

  it('deletes a habit', async () => {
    const cookie = await getAuthCookie();
    const createRes = await request(app)
      .post('/api/v1/habits')
      .set('Cookie', cookie)
      .send({ name: 'Delete Me', category: 'Test', frequency: 'daily' });

    const id = createRes.body.data._id;
    await request(app).delete(`/api/v1/habits/${id}`).set('Cookie', cookie);

    const getRes = await request(app).get(`/api/v1/habits/${id}`).set('Cookie', cookie);
    expect(getRes.status).toBe(404);
  });
});

describe('Habit Completion', () => {
  it('marks a habit complete and prevents duplicate', async () => {
    const cookie = await getAuthCookie();
    const createRes = await request(app)
      .post('/api/v1/habits')
      .set('Cookie', cookie)
      .send({ name: 'Daily Read', category: 'Learning', frequency: 'daily' });

    const id = createRes.body.data._id;
    const today = new Date().toISOString().slice(0, 10);

    const complete1 = await request(app)
      .post(`/api/v1/habits/${id}/completions`)
      .set('Cookie', cookie)
      .send({ date: today });
    expect(complete1.status).toBe(201);
    expect(complete1.body.alreadyCompleted).toBe(false);

    const complete2 = await request(app)
      .post(`/api/v1/habits/${id}/completions`)
      .set('Cookie', cookie)
      .send({ date: today });
    expect(complete2.status).toBe(200);
    expect(complete2.body.alreadyCompleted).toBe(true);
    expect(complete2.body.beansEarned).toBe(0);
  });

  it('awards beans on first completion only', async () => {
    const cookie = await getAuthCookie();
    const meRes1 = await request(app).get('/api/v1/auth/me').set('Cookie', cookie);
    const initialBeans = meRes1.body.data.beanBalance;

    const createRes = await request(app)
      .post('/api/v1/habits')
      .set('Cookie', cookie)
      .send({ name: 'Meditate', category: 'Health', frequency: 'daily' });
    const id = createRes.body.data._id;
    const today = new Date().toISOString().slice(0, 10);

    const complete1 = await request(app)
      .post(`/api/v1/habits/${id}/completions`)
      .set('Cookie', cookie)
      .send({ date: today });

    expect(complete1.body.beansEarned).toBeGreaterThan(0);

    const meRes2 = await request(app).get('/api/v1/auth/me').set('Cookie', cookie);
    expect(meRes2.body.data.beanBalance).toBeGreaterThan(initialBeans);
  });
});

describe('Habit History and Streak', () => {
  it('returns completion history with streak', async () => {
    const cookie = await getAuthCookie();
    const createRes = await request(app)
      .post('/api/v1/habits')
      .set('Cookie', cookie)
      .send({ name: 'Streak Habit', category: 'Test', frequency: 'daily' });

    const id = createRes.body.data._id;
    const today = new Date().toISOString().slice(0, 10);

    await request(app)
      .post(`/api/v1/habits/${id}/completions`)
      .set('Cookie', cookie)
      .send({ date: today });

    const historyRes = await request(app)
      .get(`/api/v1/habits/${id}/history`)
      .set('Cookie', cookie);

    expect(historyRes.status).toBe(200);
    expect(historyRes.body.data.currentStreak).toBeGreaterThanOrEqual(1);
  });
});
