import { describe, expect, it, vi } from 'vitest';

import { evlogMiddleware, getRequestLogger, loggerContext } from './logger';

describe('.server/logger', () => {
  it('returns context logger when present in context', () => {
    const mockLogger = {
      set: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      getContext: vi.fn(),
      emit: vi.fn(),
      fork: vi.fn(),
      audit: vi.fn(),
    };
    const context = {
      get: vi.fn((key) => (key === loggerContext ? mockLogger : undefined)),
    };

    const resolved = getRequestLogger(context);
    expect(resolved).toBe(mockLogger);
    expect(context.get).toHaveBeenCalledWith(loggerContext);
  });

  it('falls back to a wide event logger when outside middleware context', () => {
    const resolved = getRequestLogger({});
    expect(resolved).toBeDefined();
    expect(typeof resolved.set).toBe('function');
    expect(typeof resolved.error).toBe('function');
    expect(() => resolved.set({ test: { ok: true } })).not.toThrow();
  });

  it('exports evlogMiddleware function', () => {
    expect(typeof evlogMiddleware).toBe('function');
  });
});
