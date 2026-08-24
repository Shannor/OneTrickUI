import pino from 'pino';

export const Logger = pino({
  browser: {
    asObject: true,
  },
});
