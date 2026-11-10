import { describe, expect, it, vi } from 'vitest';

import {
  evlogMiddleware,
  getRequestLogger,
  log,
  logServerError,
  loggerContext,
} from './logger';

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

  it('attaches error to existing context logger in logServerError', () => {
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
    const request = new Request('https://d2onetrick.com/action/end-session', {
      method: 'POST',
    });

    logServerError(new Error('Failure in action'), {
      request,
      params: { id: '123' },
      context,
    });

    expect(mockLogger.error).toHaveBeenCalledWith(expect.any(Error), {
      status: 500,
      params: { id: '123' },
    });
  });

  it('emits standalone wide error event with message when context has no logger', () => {
    const errorSpy = vi.spyOn(log, 'error');
    const request = new Request('https://d2onetrick.com/action/end-session', {
      method: 'POST',
    });

    logServerError(new Error('Bad Request'), {
      request,
      context: {},
    });

    expect(errorSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        path: '/action/end-session',
        status: 400,
        message: 'POST /action/end-session 400 - Bad Request',
      }),
    );
    errorSpy.mockRestore();
  });
});
