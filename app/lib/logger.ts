import pino from 'pino';

const PINO_LEVEL_TO_SEVERITY: Record<number, string> = {
  10: 'DEBUG',
  20: 'DEBUG',
  30: 'INFO',
  40: 'WARNING',
  50: 'ERROR',
  60: 'CRITICAL',
};

export const Logger = pino({
  messageKey: 'message',
  timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
  formatters: {
    level(_label, numericLevel) {
      return {
        severity: PINO_LEVEL_TO_SEVERITY[numericLevel] ?? 'DEFAULT',
        level: numericLevel,
      };
    },
  },
  browser: {
    asObject: true,
  },
});
