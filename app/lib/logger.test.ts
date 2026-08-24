import { describe, expect, it } from 'vitest';

import { Logger } from './logger';

describe('Logger', () => {
  it('logs info, error, warn without throwing', () => {
    expect(() => Logger.info('test info')).not.toThrow();
    expect(() => Logger.error('test error')).not.toThrow();
    expect(() => Logger.warn('test warn')).not.toThrow();
  });

  it('provides a child logger', () => {
    const child = Logger.child({ context: 'test' });
    expect(child).toBeDefined();
    expect(typeof child.error).toBe('function');
  });
});
