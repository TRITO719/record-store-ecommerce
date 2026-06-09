/**
 * Unit tests for orderService
 * Mocks: orderRepository, authRepository, productCache, withRetry, jsonwebtoken
 */

// ── Mock modules BEFORE importing the service ────────────────────────────────

jest.mock('../modules/orders/order.repository', () => ({
  orderRepository: {
    createCheckoutOrder: jest.fn(),
    findMyOrders: jest.fn(),
  },
}));

jest.mock('../modules/auth/auth.repository', () => ({
  authRepository: {
    findUserById: jest.fn(),
    updateUser: jest.fn(),
  },
}));

jest.mock('../modules/products/product.cache', () => ({
  productCache: {
    deleteCachedProduct: jest.fn(),
  },
}));

// withRetry: just invoke fn() immediately — no retry delays in unit tests
jest.mock('../utils/retry', () => ({
  withRetry: jest.fn().mockImplementation((fn: () => Promise<unknown>) => fn()),
}));

// jsonwebtoken is CJS — mock the whole module object
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock.jwt.token'),
  verify: jest.fn(),
}));

jest.mock('../config/env', () => ({
  env: { JWT_SECRET: 'test-secret' },
}));

// ── Imports after mocks ───────────────────────────────────────────────────────

import { orderService } from '../modules/orders/order.service';
import { orderRepository } from '../modules/orders/order.repository';
import { authRepository } from '../modules/auth/auth.repository';
import { productCache } from '../modules/products/product.cache';

// Use require() to get the mocked CJS module references directly
const jwtMock = require('jsonwebtoken') as { sign: jest.Mock; verify: jest.Mock };

const mockOrderRepo = orderRepository as jest.Mocked<typeof orderRepository>;
const mockAuthRepo = authRepository as jest.Mocked<typeof authRepository>;
const mockCache = productCache as jest.Mocked<typeof productCache>;

// ── Fixtures ──────────────────────────────────────────────────────────────────

const mockOrder = {
  id: 'order-1',
  userId: 'user-1',
  customerEmail: 'buyer@example.com',
  customerPhone: '0912345678',
  shippingAddr: '123 Đường ABC',
  totalAmount: 300000,
  status: 'PENDING',
  createdAt: new Date(),
  updatedAt: new Date(),
  orderItems: [
    { id: 'item-1', productId: 'prod-1', quantity: 2, priceAtTime: 150000 },
  ],
};

const checkoutBody = {
  customerEmail: 'buyer@example.com',
  customerPhone: '0912345678',
  customerName: 'Buyer Name',
  shippingAddr: '123 Đường ABC',
  items: [{ id: 'prod-1', quantity: 2 }],
};

const existingUser = {
  id: 'user-1',
  email: 'buyer@example.com',
  password: '$2b$hashed',
  fullName: 'Buyer Name',
  phone: null,
  address: null,
  role: 'USER' as const,
  isVerified: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// ─────────────────────────────────────────────────────────────────────────────
// orderService.checkout
// ─────────────────────────────────────────────────────────────────────────────

describe('orderService.checkout', () => {
  // ── Happy paths ──────────────────────────────────────────────────────────

  it('✅ [HP-1] creates an order successfully for an authenticated user', async () => {
    mockOrderRepo.createCheckoutOrder.mockResolvedValue(mockOrder);
    mockAuthRepo.findUserById.mockResolvedValue(existingUser);
    mockAuthRepo.updateUser.mockResolvedValue(existingUser);
    mockCache.deleteCachedProduct.mockResolvedValue(undefined);

    // Simulate jwt.verify returning a valid payload
    jwtMock.verify.mockReturnValue({ userId: 'user-1' } as any);

    const result = await orderService.checkout(checkoutBody, 'Bearer valid.jwt.token');

    expect(result).toEqual(mockOrder);
    expect(mockOrderRepo.createCheckoutOrder).toHaveBeenCalledWith(
      'user-1',
      checkoutBody.customerEmail,
      checkoutBody.customerPhone,
      checkoutBody.shippingAddr,
      checkoutBody.items,
    );
  });

  it('✅ [HP-2] creates a guest order (no auth header) with userId=null', async () => {
    const guestOrder = { ...mockOrder, userId: null };
    mockOrderRepo.createCheckoutOrder.mockResolvedValue(guestOrder);
    mockCache.deleteCachedProduct.mockResolvedValue(undefined);

    const result = await orderService.checkout(checkoutBody, undefined);

    expect(result.userId).toBeNull();
    expect(mockOrderRepo.createCheckoutOrder).toHaveBeenCalledWith(
      null,
      checkoutBody.customerEmail,
      checkoutBody.customerPhone,
      checkoutBody.shippingAddr,
      checkoutBody.items,
    );
  });

  it('✅ [HP-3] backfills empty profile fields after a successful order', async () => {
    const userWithNoProfile = { ...existingUser, fullName: null, phone: null, address: null };
    mockOrderRepo.createCheckoutOrder.mockResolvedValue(mockOrder);
    mockAuthRepo.findUserById.mockResolvedValue(userWithNoProfile as any);
    mockAuthRepo.updateUser.mockResolvedValue({ ...userWithNoProfile, fullName: 'Buyer Name' } as any);
    mockCache.deleteCachedProduct.mockResolvedValue(undefined);

    jwtMock.verify.mockReturnValue({ userId: 'user-1' } as any);

    await orderService.checkout(checkoutBody, 'Bearer valid.jwt.token');

    expect(mockAuthRepo.updateUser).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({
        fullName: 'Buyer Name',
        phone: '0912345678',
        address: '123 Đường ABC',
      }),
    );
  });

  it('✅ [HP-4] invalidates Redis cache for each ordered product', async () => {
    const bodyWithMultiple = {
      ...checkoutBody,
      items: [{ id: 'prod-1', quantity: 1 }, { id: 'prod-2', quantity: 3 }],
    };
    mockOrderRepo.createCheckoutOrder.mockResolvedValue(mockOrder);
    mockCache.deleteCachedProduct.mockResolvedValue(undefined);

    await orderService.checkout(bodyWithMultiple, undefined);

    expect(mockCache.deleteCachedProduct).toHaveBeenCalledTimes(2);
    expect(mockCache.deleteCachedProduct).toHaveBeenCalledWith('prod-1');
    expect(mockCache.deleteCachedProduct).toHaveBeenCalledWith('prod-2');
  });

  // ── Edge cases ───────────────────────────────────────────────────────────

  it('🔴 [EC-1] throws "Cart is empty" when items array is empty', async () => {
    await expect(
      orderService.checkout({ ...checkoutBody, items: [] }, undefined),
    ).rejects.toThrow('Cart is empty');
  });

  it('🔴 [EC-2] throws "Cart is empty" when items field is missing', async () => {
    await expect(
      orderService.checkout({ customerEmail: 'a@b.com' }, undefined),
    ).rejects.toThrow('Cart is empty');
  });

  it('🔴 [EC-3] propagates "Not enough stock" error from repository', async () => {
    // Make the underlying createCheckoutOrder throw
    mockOrderRepo.createCheckoutOrder.mockRejectedValue(
      new Error('Not enough stock for Vinyl Record A'),
    );

    await expect(
      orderService.checkout(checkoutBody, undefined),
    ).rejects.toThrow('Not enough stock for Vinyl Record A');
  });

  it('🔴 [EC-4] still succeeds even if cache invalidation throws (non-critical)', async () => {
    mockOrderRepo.createCheckoutOrder.mockResolvedValue(mockOrder);
    mockCache.deleteCachedProduct.mockRejectedValue(new Error('Redis down'));

    // Should NOT throw — cache failure is non-critical
    const result = await orderService.checkout(checkoutBody, undefined);
    expect(result).toEqual(mockOrder);
  });

  it('🔴 [EC-5] still succeeds even if profile update throws (non-critical)', async () => {
    mockOrderRepo.createCheckoutOrder.mockResolvedValue(mockOrder);
    mockCache.deleteCachedProduct.mockResolvedValue(undefined);
    mockAuthRepo.findUserById.mockRejectedValue(new Error('DB connection error'));

    jwtMock.verify.mockReturnValue({ userId: 'user-1' } as any);

    // Profile update failure is non-critical — order should still succeed
    const result = await orderService.checkout(checkoutBody, 'Bearer valid.jwt.token');
    expect(result).toEqual(mockOrder);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// orderService.getUserIdFromAuthHeader
// ─────────────────────────────────────────────────────────────────────────────

describe('orderService.getUserIdFromAuthHeader', () => {
  it('✅ [HP-5] extracts userId from a valid Bearer token', () => {
    jwtMock.verify.mockReturnValue({ userId: 'user-abc' } as any);

    const id = orderService.getUserIdFromAuthHeader('Bearer some.valid.token');

    expect(id).toBe('user-abc');
  });

  it('🔴 [EC-6] returns null when Authorization header is missing', () => {
    expect(orderService.getUserIdFromAuthHeader(undefined)).toBeNull();
  });

  it('🔴 [EC-7] returns null when JWT verification fails (expired / tampered)', () => {
    jwtMock.verify.mockImplementation(() => {
      throw new Error('JsonWebTokenError');
    });

    expect(orderService.getUserIdFromAuthHeader('Bearer bad.token')).toBeNull();
  });
});
