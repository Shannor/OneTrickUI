import { execSync } from 'node:child_process';

export interface DevWorktreeHmrConfig {
  host: string;
  port: number;
  clientPort: number;
}

export interface DevWorktreeConfig {
  branch: string | null;
  port: number;
  hmr: DevWorktreeHmrConfig | undefined;
}

export interface ResolveDevWorktreeOptions {
  env?: NodeJS.ProcessEnv;
  execCommand?: (command: string) => string;
}

const DEFAULT_DEV_PORT = 5173;
const NGROK_HOST = 'local.d2onetrick.ngrok.app';

function defaultExecCommand(command: string): string {
  const existingPath = process.env.PATH ?? '';
  const extraPaths = ['/opt/homebrew/bin', '/usr/local/bin'];
  const mergedPath = [...extraPaths, existingPath].filter(Boolean).join(':');

  return execSync(command, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
    env: {
      ...process.env,
      PATH: mergedPath,
    },
  });
}

function parseValidPort(raw: string | undefined): number | null {
  if (!raw) {
    return null;
  }
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) {
    return null;
  }
  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    return null;
  }
  return parsed;
}

export function hashBranchToPort(branch: string): number {
  let hash = 2166136261;
  for (let i = 0; i < branch.length; i++) {
    hash ^= branch.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return 10000 + ((hash >>> 0) % 10000);
}

function resolveGitBranch(
  env: NodeJS.ProcessEnv,
  execCommand: (command: string) => string,
): string | null {
  const envBranch = env.DEV_BRANCH?.trim();
  if (envBranch) {
    return envBranch;
  }

  try {
    const branch = execCommand('git rev-parse --abbrev-ref HEAD').trim();
    if (!branch || branch === 'HEAD') {
      return null;
    }
    return branch;
  } catch {
    return null;
  }
}

function resolveWorktrunkPort(
  execCommand: (command: string) => string,
): number | null {
  try {
    const output = execCommand("wt step eval '{{ branch | hash_port }}'");
    return parseValidPort(output);
  } catch {
    return null;
  }
}

export function resolveDevWorktreeConfig(
  options: ResolveDevWorktreeOptions = {},
): DevWorktreeConfig {
  const env = options.env ?? process.env;
  const execCommand = options.execCommand ?? defaultExecCommand;

  const branch = resolveGitBranch(env, execCommand);
  const useNgrok = env.NGROK === 'true' || env.NGROK === '1';
  const explicitPort = parseValidPort(env.PORT);

  let port: number;
  if (explicitPort !== null) {
    port = explicitPort;
  } else if (useNgrok) {
    port = DEFAULT_DEV_PORT;
  } else {
    const wtPort = resolveWorktrunkPort(execCommand);
    if (wtPort !== null) {
      port = wtPort;
    } else if (branch) {
      port = hashBranchToPort(branch);
    } else {
      port = DEFAULT_DEV_PORT;
    }
  }

  const hmr: DevWorktreeHmrConfig | undefined = useNgrok
    ? {
        host: NGROK_HOST,
        port,
        clientPort: 443,
      }
    : undefined;

  return {
    branch,
    port,
    hmr,
  };
}
