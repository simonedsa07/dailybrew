import { describe, it, expect, beforeAll, afterAll, afterEach } from '@jest/globals';
import request from 'supertest';
import app from '../src/app';
import { connectTestDB, closeTestDB, clearTestDB } from './testDb';

beforeAll(async () => {
  await connectTestDB();
});

afterAll(async () => {
  await closeTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

describe('POST /api/v1/auth/register', () => {
  it('registers a new user successfully', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe('test@example.com');
    expect(res.body.data).not.toHaveProperty('passwordHash');
  });

  it('rejects duplicate email registration', async () => {
    await request(app).post('/api/v1/auth/register').send({
      name: 'User A',
      email: 'dup@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    });

    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'User B',
      email: 'dup@example.com',
      password: 'password456',
      confirmPassword: 'password456',
    });
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('rejects mismatched passwords', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'User',
      email: 'mismatch@example.com',
      password: 'password123',
      confirmPassword: 'differentpassword',
    });
    expect(res.status).toBe(400);
  });

  it('rejects short passwords', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'User',
      email: 'short@example.com',
      password: '123',
      confirmPassword: '123',
    });
    expect(res.status).toBe(400);
  });

  it('rejects invalid email format', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'User',
      email: 'not-an-email',
      password: 'password123',
      confirmPassword: 'password123',
    });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/v1/auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/api/v1/auth/register').send({
      name: 'Login User',
      email: 'login@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    });
  });

  it('logs in with correct credentials', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'login@example.com',
      password: 'password123',
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // Should set an httpOnly cookie
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('rejects incorrect password', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'login@example.com',
      password: 'wrongpassword',
    });
    expect(res.status).toBe(401);
  });

  it('rejects unknown email', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'unknown@example.com',
      password: 'password123',
    });
    expect(res.status).toBe(401);
  });
});

describe('Protected routes', () => {
  it('denies access without authentication', async () => {
    const res = await request(app).get('/api/v1/habits');
    expect(res.status).toBe(401);
  });

  it('denies access with invalid token', async () => {
    const res = await request(app)
      .get('/api/v1/habits')
      .set('Cookie', 'token=invalidtoken');
    expect(res.status).toBe(401);
  });
});

async function loginAndGetCookie(email = 'auth@example.com', password = 'password123') {
  await request(app).post('/api/v1/auth/register').send({
    name: 'Auth User',
    email,
    password,
    confirmPassword: password,
  });
  const loginRes = await request(app).post('/api/v1/auth/login').send({ email, password });
  const cookie = loginRes.headers['set-cookie']?.[0] || '';
  return cookie;
}

describe('Cross-user access prevention', () => {
  it('user A cannot access user B habits', async () => {
    const cookieA = await loginAndGetCookie('userA@example.com', 'passwordA1');
    const cookieB = await loginAndGetCookie('userB@example.com', 'passwordB1');

    const createRes = await request(app)
      .post('/api/v1/habits')
      .set('Cookie', cookieA)
      .send({ name: 'User A Habit', category: 'Health', frequency: 'daily' });

    const habitId = createRes.body.data._id;

    const res = await request(app)
      .get(`/api/v1/habits/${habitId}`)
      .set('Cookie', cookieB);

    expect(res.status).toBe(404); // Not found (from user B's perspective)
  });
});
