import type { EnrichContext, WideEvent } from 'evlog';
import { defineEvlog } from 'evlog';
import { createFsDrain } from 'evlog/fs';

function resolveEventTarget(event: WideEvent): string | undefined {
  if (event.action) {
    return `action:${String(event.action)}`;
  }
  if (event.route) {
    return String(event.route);
  }
  if (event.layout) {
    return String(event.layout);
  }
  if (event.loader) {
    return `loader:${String(event.loader)}`;
  }
  return undefined;
}

function resolveEventErrorMessage(event: WideEvent): string | undefined {
  const err = event.error as { message?: string } | string | undefined;
  if (!err) {
    return undefined;
  }
  if (err instanceof Object && 'message' in err && err.message) {
    return String(err.message);
  }
  return String(err);
}

function formatWideEventMessage({ event, request, response }: EnrichContext) {
  if (event.message) {
    return;
  }
  const method = event.method ? String(event.method) : request?.method;
  const path = event.path ? String(event.path) : request?.path;
  const status = event.status ?? response?.status;
  const duration = event.duration ? String(event.duration) : undefined;
  const target = resolveEventTarget(event);
  const errorMessage = resolveEventErrorMessage(event);

  const parts: string[] = [];
  if (method && path) {
    parts.push(`${method} ${path}`);
  } else if (path) {
    parts.push(path);
  }
  if (status !== undefined) {
    parts.push(String(status));
  }
  if (target) {
    parts.push(`[${target}]`);
  }
  if (duration) {
    parts.push(`in ${duration}`);
  }
  if (errorMessage) {
    parts.push(`- ${errorMessage}`);
  }

  if (parts.length > 0) {
    event.message = parts.join(' ');
  }
}

/**
 * Settings for one-trick-ui, read by the app and by the evlog CLI.
 * https://evlog.dev/cli/config
 */
export default defineEvlog({
  service: 'one-trick-ui',
  // Local NDJSON under .evlog/logs, in development only.
  drain: process.env.NODE_ENV === 'production' ? undefined : createFsDrain(),
  enrich: formatWideEventMessage,
});
