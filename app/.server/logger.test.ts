import type { AuditableLogger } from 'evlog';
import { describe, expect, it, vi } from 'vitest';

import {
  evlogMiddleware,
  getRequestLogger,
  log,
  logServerError,
  loggerContext,
  runWithForkedLogger,
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

  describe('runWithForkedLogger', () => {
    it('falls back directly to parentLog when fork is unavailable', async () => {
      const parentLog = {
        set: vi.fn(),
        error: vi.fn(),
      } as unknown as AuditableLogger;

      const value = await runWithForkedLogger(
        parentLog,
        'home.top_loadouts',
        async (activeLog) => {
          activeLog.set({ step: 'fallback' });
          return 'ok';
        },
      );

      expect(value).toBe('ok');
      expect(parentLog.set).toHaveBeenCalledWith({ step: 'fallback' });
    });

    it('invokes parentLog.fork with label and resolves with callback return value', async () => {
      const forkSpy = vi.fn(
        async (_label: string, fn: () => void | Promise<void>) => {
          await fn();
        },
      );
      const parentLog = {
        set: vi.fn(),
        error: vi.fn(),
        fork: forkSpy,
      } as unknown as AuditableLogger;

      const value = await runWithForkedLogger(
        parentLog,
        'loadout.similar_count',
        async (activeLog) => {
          activeLog.set({ snapshot: { similarCount: 3 } });
          return 3;
        },
      );

      expect(forkSpy).toHaveBeenCalledWith(
        'loadout.similar_count',
        expect.any(Function),
      );
      expect(value).toBe(3);
      expect(parentLog.set).toHaveBeenCalledWith({
        snapshot: { similarCount: 3 },
      });
    });

    it('falls back to parentLog when parentLog.fork throws synchronously', async () => {
      const parentLog = {
        set: vi.fn(),
        error: vi.fn(),
        fork: vi.fn(() => {
          throw new Error('missing requestId');
        }),
      } as unknown as AuditableLogger;

      const value = await runWithForkedLogger(
        parentLog,
        'home.top_loadouts',
        async (activeLog) => {
          activeLog.set({ recovered: true });
          return 'recovered';
        },
      );

      expect(value).toBe('recovered');
      expect(parentLog.set).toHaveBeenCalledWith({ recovered: true });
    });

    it('propagates rejection from fn to both result promise and fork scope', async () => {
      let forkCaught: unknown;
      const forkSpy = vi.fn(
        async (_label: string, fn: () => void | Promise<void>) => {
          try {
            await fn();
          } catch (err) {
            forkCaught = err;
          }
        },
      );
      const parentLog = {
        set: vi.fn(),
        error: vi.fn(),
        fork: forkSpy,
      } as unknown as AuditableLogger;

      await expect(
        runWithForkedLogger(parentLog, 'home.top_loadouts', async () => {
          throw new Error('boom');
        }),
      ).rejects.toThrow('boom');
      expect(forkCaught).toBeInstanceOf(Error);
      expect((forkCaught as Error).message).toBe('boom');
    });
  });
});
