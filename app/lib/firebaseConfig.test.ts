import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockInitializeApp = vi.fn(() => ({ name: 'mock-app' }));
const mockGetFirestore = vi.fn(() => ({ type: 'mock-firestore' }));

vi.mock('firebase/app', () => ({
  initializeApp: mockInitializeApp,
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: mockGetFirestore,
}));

describe('getFirestoreDb', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('does not initialize Firebase on module import and caches the Firestore instance on first call', async () => {
    const { getFirestoreDb } = await import('./firebaseConfig');

    expect(mockInitializeApp).not.toHaveBeenCalled();
    expect(mockGetFirestore).not.toHaveBeenCalled();

    const first = await getFirestoreDb();
    const second = await getFirestoreDb();

    expect(first).toBe(second);
    expect(mockInitializeApp).toHaveBeenCalledTimes(1);
    expect(mockGetFirestore).toHaveBeenCalledTimes(1);
  });
});
