import {
  createLogger,
  initLogger,
  log,
  parseError,
  toLoggerConfig,
  toMiddlewareOptions,
  withAuditMethods,
} from 'evlog';
import type { AuditableLogger } from 'evlog';
import { evlog, loggerContext, useLogger } from 'evlog/react-router';
import { isRouteErrorResponse } from 'react-router';

import config from '../../evlog.config';

initLogger(toLoggerConfig(config));

export const evlogMiddleware = evlog(toMiddlewareOptions(config));

export { log, loggerContext, useLogger };

function tryGetContextLogger(context?: unknown): AuditableLogger | undefined {
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
      return undefined;
    }
  }
  return undefined;
}

export function getRequestLogger(context?: unknown): AuditableLogger {
  const ctxLog = tryGetContextLogger(context);
  if (ctxLog) {
    return ctxLog;
  }

  try {
    return useLogger();
  } catch {
    return withAuditMethods(createLogger());
  }
}

function resolvePathname(urlStr: string): string {
  try {
    return new URL(urlStr).pathname;
  } catch {
    return urlStr;
  }
}

function buildErrorField(unpacked: Error | object | string, message: string) {
  if (unpacked instanceof Error) {
    const errRecord: Record<string, string> = {
      name: unpacked.name,
      message,
    };
    if (unpacked.stack) {
      errRecord.stack = unpacked.stack;
    }
    return errRecord;
  }
  return { name: 'Error', message };
}

export function logServerError(
  error: Error | object | string,
  {
    request,
    params,
    context,
  }: {
    request: Request;
    params?: Record<string, string | undefined>;
    context?: object;
  },
): void {
  if (request.signal.aborted) {
    return;
  }

  const unpacked =
    isRouteErrorResponse(error) && 'error' in error && error.error
      ? (error.error as Error)
      : error;
  const parsed = parseError(unpacked);
  let status = isRouteErrorResponse(error) ? error.status : parsed.status;
  if (status === 500 && parsed.message === 'Bad Request') {
    status = 400;
  }
  const pathname = resolvePathname(request.url);
  const hasParams = Boolean(params && Object.keys(params).length > 0);

  const ctxLog = tryGetContextLogger(context);
  if (ctxLog) {
    const meta: Record<string, unknown> = { status };
    if (hasParams) {
      meta.params = params;
    }
    ctxLog.error(
      unpacked instanceof Error ? unpacked : new Error(parsed.message),
      meta,
    );
    return;
  }

  const payload: Record<string, unknown> = {
    method: request.method,
    path: pathname,
    status,
    message: `${request.method} ${pathname} ${status} - ${parsed.message}`,
    error: buildErrorField(unpacked, parsed.message),
  };
  if (hasParams) {
    payload.params = params;
  }
  log.error(payload);
}
