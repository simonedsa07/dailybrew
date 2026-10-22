import { describe, it, expect, beforeAll, afterAll, afterEach } from '@jest/globals';
import request from 'supertest';
import app from '../src/app';
import { connectTestDB, closeTestDB, clearTestDB } from './testDb';
import { CafeItem } from '../src/models/CafeItem';

beforeAll(async () => {
  await connectTestDB();
  // Seed a test item
  await CafeItem.create({
    itemId: 'test-plant',
    name: 'Test Plant',
    category: 'plants',
    description: 'A test plant',
    price: 10,
    assetKey: 'plant_test',
    width: 1,
    height: 1,
    isRepeatable: false,
    sortOrder: 1,
  });
});
afterAll(async () => { await closeTestDB(); });
afterEach(async () => {
  const { User } = await import('../src/models/User');
  const { CafeLayout } = await import('../src/models/CafeLayout');
  const { RewardLedger } = await import('../src/models/RewardLedger');
  await User.deleteMany({});
  await CafeLayout.deleteMany({});
  await RewardLedger.deleteMany({});
});

async function registerAndLogin(email: string) {
  const regRes = await request(app).post('/api/v1/auth/register').send({
    name: 'Cafe Tester',
    email,
    password: 'password123',
    confirmPassword: 'password123',
  });
  const loginRes = await request(app).post('/api/v1/auth/login').send({ email, password: 'password123' });
  return { cookie: loginRes.headers['set-cookie']?.[0] || '', userId: regRes.body.data.id };
}

describe('Café Catalog', () => {
  it('returns catalog items', async () => {
    const { cookie } = await registerAndLogin('catalog@example.com');
    const res = await request(app).get('/api/v1/cafe/items').set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe('Café Purchase', () => {
  it('purchases an affordable item and deducts beans', async () => {
    const { cookie, userId } = await registerAndLogin('purchase@example.com');
    // Give user enough beans
    const { User } = await import('../src/models/User');
    await User.findByIdAndUpdate(userId, { beanBalance: 50 });

    const purchaseRes = await request(app)
      .post('/api/v1/cafe/purchases')
      .set('Cookie', cookie)
      .send({ itemId: 'test-plant' });

    expect(purchaseRes.status).toBe(200);
    expect(purchaseRes.body.data.newBeanBalance).toBe(40); // 50 - 10

    const inventoryRes = await request(app).get('/api/v1/cafe/inventory').set('Cookie', cookie);
    expect(inventoryRes.body.data.some((i: { itemId: string }) => i.itemId === 'test-plant')).toBe(true);
  });

  it('rejects purchase with insufficient beans', async () => {
    const { cookie } = await registerAndLogin('broke@example.com');
    // User starts with 0 beans
    const res = await request(app)
      .post('/api/v1/cafe/purchases')
      .set('Cookie', cookie)
      .send({ itemId: 'test-plant' });

    expect(res.status).toBe(402);
  });

  it('prevents duplicate purchase of non-repeatable items', async () => {
    const { cookie, userId } = await registerAndLogin('dup@example.com');
    const { User } = await import('../src/models/User');
    await User.findByIdAndUpdate(userId, { beanBalance: 100 });

    await request(app).post('/api/v1/cafe/purchases').set('Cookie', cookie).send({ itemId: 'test-plant' });
    const dup = await request(app).post('/api/v1/cafe/purchases').set('Cookie', cookie).send({ itemId: 'test-plant' });
    expect(dup.status).toBe(409);
  });
});

describe('Café Layout Persistence', () => {
  it('saves and retrieves layout', async () => {
    const { cookie, userId } = await registerAndLogin('layout@example.com');
    const { User } = await import('../src/models/User');
    await User.findByIdAndUpdate(userId, { beanBalance: 100 });

    await request(app).post('/api/v1/cafe/purchases').set('Cookie', cookie).send({ itemId: 'test-plant' });

    const layoutRes = await request(app)
      .put('/api/v1/cafe/layout')
      .set('Cookie', cookie)
      .send({
        placements: [{ instanceId: 'inst-1', itemId: 'test-plant', slotX: 2, slotY: 3 }],
      });
    expect(layoutRes.status).toBe(200);

    const getRes = await request(app).get('/api/v1/cafe').set('Cookie', cookie);
    expect(getRes.body.data.layout.placements).toHaveLength(1);
    expect(getRes.body.data.layout.placements[0].slotX).toBe(2);
  });
});
