import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockInitializeApp = vi.fn(() => ({ name: 'mock-app' }));
const mockGetFirestore = vi.fn(() => ({ type: 'mock-firestore' }));
const mockDoc = vi.fn((_db: unknown, collection: string, id: string) => ({
  collection,
  id,
}));
const mockOnSnapshot = vi.fn();

vi.mock('firebase/app', () => ({
  initializeApp: mockInitializeApp,
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: mockGetFirestore,
  doc: mockDoc,
  onSnapshot: mockOnSnapshot,
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

describe('subscribeToDocument', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('lazily loads Firestore, forwards snapshot data to onData, and unsubscribes cleanly', async () => {
    const mockFirestoreUnsubscribe = vi.fn();
    let capturedNext: ((snapshot: { data: () => unknown }) => void) | undefined;

    mockOnSnapshot.mockImplementationOnce((_docRef, next) => {
      capturedNext = next;
      return mockFirestoreUnsubscribe;
    });

    const { subscribeToDocument } = await import('./firebaseConfig');
    const onData = vi.fn();
    const unsubscribe = subscribeToDocument('sessions', 'session-123', {
      onData,
    });

    await vi.waitFor(() => {
      expect(mockOnSnapshot).toHaveBeenCalledTimes(1);
    });

    expect(mockDoc).toHaveBeenCalledWith(
      { type: 'mock-firestore' },
      'sessions',
      'session-123',
    );

    capturedNext!({ data: () => ({ id: 'session-123', status: 'pending' }) });
    expect(onData).toHaveBeenCalledWith({
      id: 'session-123',
      status: 'pending',
    });

    unsubscribe();
    expect(mockFirestoreUnsubscribe).toHaveBeenCalledTimes(1);
  });

  it('does not attach onSnapshot if unsubscribed before Firestore finishes loading', async () => {
    const { subscribeToDocument } = await import('./firebaseConfig');
    const unsubscribe = subscribeToDocument('sessions', 'session-cancelled', {
      onData: vi.fn(),
    });

    unsubscribe();
    await Promise.resolve();
    await Promise.resolve();

    expect(mockOnSnapshot).not.toHaveBeenCalled();
  });

  it('forwards both listener errors and initialization errors to onError', async () => {
    let capturedError: ((error: unknown) => void) | undefined;
    mockOnSnapshot.mockImplementationOnce((_docRef, _next, onError) => {
      capturedError = onError;
      return vi.fn();
    });

    const { subscribeToDocument } = await import('./firebaseConfig');
    const onError = vi.fn();
    subscribeToDocument('sessions', 'session-err', {
      onData: vi.fn(),
      onError,
    });

    await vi.waitFor(() => {
      expect(capturedError).toBeDefined();
    });

    const snapshotError = new Error('Connection lost');
    capturedError!(snapshotError);
    expect(onError).toHaveBeenCalledWith(snapshotError);

    vi.resetModules();
    mockInitializeApp.mockImplementationOnce(() => {
      throw new Error('Firebase init failed');
    });

    const fresh = await import('./firebaseConfig');
    const onInitError = vi.fn();
    fresh.subscribeToDocument('sessions', 'session-init-err', {
      onData: vi.fn(),
      onError: onInitError,
    });

    await vi.waitFor(() => {
      expect(onInitError).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Firebase init failed' }),
      );
    });
  });
});
