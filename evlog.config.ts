import { defineEvlog } from 'evlog';
import { createFsDrain } from 'evlog/fs';

/**
 * Settings for one-trick-ui, read by the app and by the evlog CLI.
 * https://evlog.dev/cli/config
 */
export default defineEvlog({
  service: 'one-trick-ui',
  // Local NDJSON under .evlog/logs, in development only.
  drain: process.env.NODE_ENV === 'production' ? undefined : createFsDrain(),
});
