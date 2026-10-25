import { describe, it, expect, beforeAll, afterAll, afterEach } from '@jest/globals';
import request from 'supertest';
import app from '../src/app';
import { connectTestDB, closeTestDB } from './testDb';
import { User } from '../src/models/User';
import { Transaction } from '../src/models/Transaction';
import { getMonthEnd } from '../src/utils/dateUtils';

beforeAll(async () => {
  await connectTestDB();
});

afterAll(async () => {
  await closeTestDB();
});

afterEach(async () => {
  await User.deleteMany({});
  await Transaction.deleteMany({});
});

async function registerAndLogin(email = 'expense@example.com') {
  await request(app).post('/api/v1/auth/register').send({
    name: 'Expense Tester',
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

describe('Expenses & Budget Calculations', () => {
  it('creates an expense and validates required positive amounts', async () => {
    const cookie = await registerAndLogin();

    // Valid creation
    const res = await request(app)
      .post('/api/v1/transactions')
      .set('Cookie', cookie)
      .send({
        type: 'expense',
        description: 'Matcha Latte',
        amount: 250,
        category: 'Food & drinks',
        transactionDate: '2025-02-14',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.description).toBe('Matcha Latte');
    expect(res.body.data.amount).toBe(250);

    // Negative amount rejected
    const badRes = await request(app)
      .post('/api/v1/transactions')
      .set('Cookie', cookie)
      .send({
        type: 'expense',
        description: 'Negative spend',
        amount: -50,
        category: 'Food & drinks',
        transactionDate: '2025-02-14',
      });
    expect(badRes.status).toBe(400);

    // Zero amount rejected
    const zeroRes = await request(app)
      .post('/api/v1/transactions')
      .set('Cookie', cookie)
      .send({
        type: 'expense',
        description: 'Zero spend',
        amount: 0,
        category: 'Food & drinks',
        transactionDate: '2025-02-14',
      });
    expect(zeroRes.status).toBe(400);
  });

  it('updates an existing expense using PATCH endpoint', async () => {
    const cookie = await registerAndLogin();

    const createRes = await request(app)
      .post('/api/v1/transactions')
      .set('Cookie', cookie)
      .send({
        type: 'expense',
        description: 'Old Book',
        amount: 150,
        category: 'Shopping',
        transactionDate: '2025-02-10',
      });
    const id = createRes.body.data._id;

    const updateRes = await request(app)
      .patch(`/api/v1/transactions/${id}`)
      .set('Cookie', cookie)
      .send({
        description: 'Vintage Notebook',
        amount: 180,
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.description).toBe('Vintage Notebook');
    expect(updateRes.body.data.amount).toBe(180);
  });

  it('correctly calculates February month-end and date boundary', () => {
    // Non-leap year February
    expect(getMonthEnd('2025-02')).toBe('2025-02-28');
    // Leap year February
    expect(getMonthEnd('2024-02')).toBe('2024-02-29');
    // 30-day month
    expect(getMonthEnd('2025-04')).toBe('2025-04-30');
    // 31-day month
    expect(getMonthEnd('2025-01')).toBe('2025-01-31');
  });

  it('summarizes monthly expenses accurately across date range', async () => {
    const cookie = await registerAndLogin();

    await request(app)
      .post('/api/v1/transactions')
      .set('Cookie', cookie)
      .send({
        type: 'expense',
        description: 'Feb 1 Spend',
        amount: 100,
        category: 'Food & drinks',
        transactionDate: '2025-02-01',
      });

    await request(app)
      .post('/api/v1/transactions')
      .set('Cookie', cookie)
      .send({
        type: 'expense',
        description: 'Feb 28 Spend',
        amount: 200,
        category: 'Food & drinks',
        transactionDate: '2025-02-28',
      });

    const summaryRes = await request(app)
      .get('/api/v1/transactions/summary?month=2025-02')
      .set('Cookie', cookie);

    expect(summaryRes.status).toBe(200);
    expect(summaryRes.body.data.totalExpenses).toBe(300);
  });
});
