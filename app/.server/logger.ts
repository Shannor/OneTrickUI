import {
  createLogger,
  initLogger,
  log,
  toLoggerConfig,
  toMiddlewareOptions,
  withAuditMethods,
} from 'evlog';
import type { AuditableLogger } from 'evlog';
import { evlog, loggerContext, useLogger } from 'evlog/react-router';

import config from '../../evlog.config';

initLogger(toLoggerConfig(config));

export const evlogMiddleware = evlog(toMiddlewareOptions(config));

export { log, loggerContext, useLogger };

export function getRequestLogger(context?: unknown): AuditableLogger {
  if (
    context &&
    typeof context === 'object' &&
    'get' in context &&
    typeof (context as { get?: unknown }).get === 'function'
  ) {
    try {
      const ctxLog = (
        context as { get: (key: unknown) => AuditableLogger | undefined }
      ).get(loggerContext);
      if (ctxLog) {
        return ctxLog;
      }
    } catch {
      // Fall through to useLogger() or fallback
    }
  }

  try {
    return useLogger();
  } catch {
    return withAuditMethods(createLogger());
  }
}
