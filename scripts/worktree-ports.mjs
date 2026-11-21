#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { realpathSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_DEV_PORT = 5173;
const EXTRA_PATHS = ['/opt/homebrew/bin', '/usr/local/bin'];
const UI_SERVER_COMMAND_PATTERN =
  /(?:^|[\s/\\])(?:react-router(?:-serve)?|@react-router\/dev|vite|server\.js)(?:[\s/\\]|$)/i;

function buildExecEnv(env = process.env) {
  const existingPath = env.PATH ?? '';
  const mergedPath = [...EXTRA_PATHS, existingPath].filter(Boolean).join(':');
  return {
    ...env,
    PATH: mergedPath,
  };
}

function defaultExecCommand(file, args, options = {}) {
  return execFileSync(file, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
    cwd: options.cwd,
    env: buildExecEnv(options.env),
  });
}

function defaultRealpath(targetPath) {
  try {
    return realpathSync(targetPath);
  } catch {
    return path.resolve(targetPath);
  }
}

export function hashBranchToPort(branch) {
  let hash = 2166136261;
  for (let i = 0; i < branch.length; i++) {
    hash ^= branch.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return 10000 + ((hash >>> 0) % 10000);
}

export function parsePortFromUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return null;
  }
  try {
    const parsed = new URL(rawUrl);
    if (!parsed.port) {
      return null;
    }
    const port = Number(parsed.port);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      return null;
    }
    return port;
  } catch {
    return null;
  }
}

export function parseWtListOutput(raw) {
  const parsed = JSON.parse(raw);
  const items = Array.isArray(parsed) ? parsed : parsed?.items;
  if (!Array.isArray(items)) {
    return [];
  }

  const worktrees = [];
  for (const item of items) {
    const worktreePath = item?.worktree?.path;
    if (!worktreePath) {
      continue;
    }

    const branch =
      typeof item.branch === 'string' && item.branch.trim()
        ? item.branch.trim()
        : null;
    const expectedUrl =
      typeof item.dev_server?.url === 'string' ? item.dev_server.url : null;
    const expectedPort =
      parsePortFromUrl(expectedUrl) ??
      (branch ? hashBranchToPort(branch) : DEFAULT_DEV_PORT);

    worktrees.push({
      branch,
      path: worktreePath,
      isMain: Boolean(item.worktree?.main),
      isCurrent: Boolean(item.worktree?.current),
      expectedPort,
      expectedUrl: expectedUrl ?? `http://localhost:${expectedPort}`,
      wtListening: Boolean(item.dev_server?.listening),
    });
  }

  return worktrees;
}

export function parseGitWorktreeList(raw, currentCwd = process.cwd()) {
  const blocks = raw
    .trim()
    .split(/\r?\n\r?\n/)
    .filter(Boolean);
  const resolvedCwd = path.resolve(currentCwd);

  return blocks
    .map((block, index) => {
      const lines = block.split(/\r?\n/);
      let worktreePath = null;
      let branch = null;

      for (const line of lines) {
        if (line.startsWith('worktree ')) {
          worktreePath = line.slice('worktree '.length).trim();
        } else if (line.startsWith('branch ')) {
          const ref = line.slice('branch '.length).trim();
          branch = ref.replace(/^refs\/heads\//, '') || null;
        }
      }

      if (!worktreePath) {
        return null;
      }

      const expectedPort = branch ? hashBranchToPort(branch) : DEFAULT_DEV_PORT;
      const resolvedPath = path.resolve(worktreePath);
      const isCurrent =
        resolvedCwd === resolvedPath ||
        resolvedCwd.startsWith(resolvedPath + path.sep);

      return {
        branch,
        path: worktreePath,
        isMain: index === 0,
        isCurrent,
        expectedPort,
        expectedUrl: `http://localhost:${expectedPort}`,
        wtListening: false,
      };
    })
    .filter(Boolean);
}

export function parseLsofListeners(raw) {
  const listeners = [];
  let currentPid = null;
  let currentCommand = '';

  for (const line of raw.split(/\r?\n/)) {
    if (!line) {
      continue;
    }

    const prefix = line[0];
    const value = line.slice(1);

    if (prefix === 'p') {
      const pid = Number(value);
      currentPid = Number.isInteger(pid) ? pid : null;
      currentCommand = '';
    } else if (prefix === 'c') {
      currentCommand = value;
    } else if (prefix === 'n' && currentPid !== null) {
      const match = value.match(/:(\d+)$/);
      if (!match) {
        continue;
      }
      const port = Number(match[1]);
      if (!Number.isInteger(port) || port < 1 || port > 65535) {
        continue;
      }
      listeners.push({
        pid: currentPid,
        commandName: currentCommand,
        port,
        address: value,
      });
    }
  }

  return listeners;
}

export function parseLsofCwd(raw) {
  const cwdByPid = new Map();
  let currentPid = null;

  for (const line of raw.split(/\r?\n/)) {
    if (!line) {
      continue;
    }

    const prefix = line[0];
    const value = line.slice(1);

    if (prefix === 'p') {
      const pid = Number(value);
      currentPid = Number.isInteger(pid) ? pid : null;
    } else if (prefix === 'n' && currentPid !== null && value) {
      cwdByPid.set(currentPid, value);
    }
  }

  return cwdByPid;
}

export function parsePsCommands(raw) {
  const commandByPid = new Map();

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }
    const match = trimmed.match(/^(\d+)\s+(.+)$/);
    if (!match) {
      continue;
    }
    const pid = Number(match[1]);
    if (Number.isInteger(pid)) {
      commandByPid.set(pid, match[2].trim());
    }
  }

  return commandByPid;
}

export function isUiServerCommand(commandLine, commandName = '') {
  const combined = [commandLine, commandName].filter(Boolean).join(' ');
  return UI_SERVER_COMMAND_PATTERN.test(combined);
}

export function matchWorktreeForPath(
  targetPath,
  worktrees,
  normalizePath = defaultRealpath,
) {
  if (!targetPath) {
    return null;
  }

  const normalizedTarget = normalizePath(targetPath);
  const sorted = [...worktrees]
    .map((worktree) => ({
      worktree,
      normalizedPath: normalizePath(worktree.path),
    }))
    .sort((a, b) => b.normalizedPath.length - a.normalizedPath.length);

  for (const candidate of sorted) {
    if (
      normalizedTarget === candidate.normalizedPath ||
      normalizedTarget.startsWith(candidate.normalizedPath + path.sep)
    ) {
      return candidate.worktree;
    }
  }

  return null;
}

function matchWorktreeInCommand(
  commandLine,
  worktrees,
  normalizePath = defaultRealpath,
) {
  if (!commandLine) {
    return null;
  }

  const sorted = [...worktrees]
    .map((worktree) => ({
      worktree,
      rawPath: worktree.path,
      normalizedPath: normalizePath(worktree.path),
    }))
    .sort((a, b) => b.normalizedPath.length - a.normalizedPath.length);

  for (const candidate of sorted) {
    for (const candidatePath of new Set([
      candidate.rawPath,
      candidate.normalizedPath,
    ])) {
      const idx = commandLine.indexOf(candidatePath);
      if (idx === -1) {
        continue;
      }
      const nextChar = commandLine[idx + candidatePath.length];
      if (
        nextChar === undefined ||
        nextChar === path.sep ||
        /\s/.test(nextChar) ||
        nextChar === '"' ||
        nextChar === "'"
      ) {
        return candidate.worktree;
      }
    }
  }

  return null;
}

function loadWorktrees(execCommand, cwd) {
  try {
    const wtJson = execCommand('wt', ['list', '--format=json'], { cwd });
    const parsed = parseWtListOutput(wtJson);
    if (parsed.length > 0) {
      return parsed;
    }
  } catch {
    // Fall back to git worktree discovery when wt CLI is unavailable.
  }

  const gitOutput = execCommand('git', ['worktree', 'list', '--porcelain'], {
    cwd,
  });
  return parseGitWorktreeList(gitOutput, cwd);
}

function loadListeningProcesses(execCommand) {
  let lsofRaw = '';
  try {
    lsofRaw = execCommand('lsof', [
      '-nP',
      '-iTCP',
      '-sTCP:LISTEN',
      '-F',
      'pcn',
    ]);
  } catch {
    return [];
  }

  const listeners = parseLsofListeners(lsofRaw);
  if (listeners.length === 0) {
    return [];
  }

  const uniquePids = [...new Set(listeners.map((listener) => listener.pid))];
  const pidArg = uniquePids.join(',');

  let cwdByPid = new Map();
  try {
    const cwdRaw = execCommand('lsof', [
      '-a',
      '-p',
      pidArg,
      '-d',
      'cwd',
      '-Fn',
    ]);
    cwdByPid = parseLsofCwd(cwdRaw);
  } catch {
    cwdByPid = new Map();
  }

  let commandByPid = new Map();
  try {
    const psRaw = execCommand('ps', [
      '-ww',
      '-o',
      'pid=,command=',
      '-p',
      pidArg,
    ]);
    commandByPid = parsePsCommands(psRaw);
  } catch {
    commandByPid = new Map();
  }

  return listeners.map((listener) => ({
    ...listener,
    cwd: cwdByPid.get(listener.pid) ?? null,
    command: commandByPid.get(listener.pid) ?? listener.commandName ?? '',
  }));
}

export function isLoopbackAddress(address) {
  if (!address || typeof address !== 'string') {
    return false;
  }
  return address.startsWith('127.0.0.1:') || address.startsWith('[::1]:');
}

export function selectPrimaryPortForProcess(processListeners, expectedPort) {
  const byPort = new Map();
  for (const listener of processListeners) {
    const existing = byPort.get(listener.port);
    const loopback = isLoopbackAddress(listener.address);
    if (!existing) {
      byPort.set(listener.port, {
        ...listener,
        isLoopback: loopback,
      });
    } else if (loopback && !existing.isLoopback) {
      existing.isLoopback = true;
    }
  }

  const candidates = [...byPort.values()];
  if (candidates.length <= 1) {
    return candidates[0] ?? null;
  }

  if (expectedPort !== null && expectedPort !== undefined) {
    const exactMatch = candidates.find((c) => c.port === expectedPort);
    if (exactMatch) {
      return exactMatch;
    }

    const incremented = candidates
      .filter((c) => c.port > expectedPort && c.port <= expectedPort + 20)
      .sort((a, b) => a.port - b.port);
    if (incremented.length > 0) {
      return incremented[0];
    }
  }

  const loopbackCandidates = candidates.filter((c) => c.isLoopback);
  const pool = loopbackCandidates.length > 0 ? loopbackCandidates : candidates;

  const standardPort = pool.find(
    (c) => c.port === DEFAULT_DEV_PORT || c.port === 3000,
  );
  if (standardPort) {
    return standardPort;
  }

  return [...pool].sort((a, b) => a.port - b.port)[0];
}

export function collectWorktreePorts(options = {}) {
  const execCommand = options.execCommand ?? defaultExecCommand;
  const normalizePath = options.normalizePath ?? defaultRealpath;
  const cwd = options.cwd ?? process.cwd();
  const includeAll = Boolean(options.includeAll);

  const worktrees = loadWorktrees(execCommand, cwd);
  const listeners = loadListeningProcesses(execCommand);

  const activeByWorktreeAndPort = new Map();
  const listenersByPort = new Map();
  const listenersByWorktreeAndPid = new Map();

  for (const listener of listeners) {
    const existing = listenersByPort.get(listener.port) ?? [];
    existing.push(listener);
    listenersByPort.set(listener.port, existing);

    const matchedByCwd = matchWorktreeForPath(
      listener.cwd,
      worktrees,
      normalizePath,
    );
    const matchedWorktree =
      matchedByCwd ??
      (isUiServerCommand(listener.command, listener.commandName)
        ? matchWorktreeInCommand(listener.command, worktrees, normalizePath)
        : null);

    if (!matchedWorktree) {
      continue;
    }

    const matchesExpectedPort = listener.port === matchedWorktree.expectedPort;
    const isUiProcess = isUiServerCommand(
      listener.command,
      listener.commandName,
    );

    if (!matchesExpectedPort && !isUiProcess) {
      continue;
    }

    const groupKey = `${normalizePath(matchedWorktree.path)}:${listener.pid}`;
    const group = listenersByWorktreeAndPid.get(groupKey) ?? {
      worktree: matchedWorktree,
      listeners: [],
    };
    group.listeners.push(listener);
    listenersByWorktreeAndPid.set(groupKey, group);
  }

  for (const {
    worktree,
    listeners: processListeners,
  } of listenersByWorktreeAndPid.values()) {
    const primary = selectPrimaryPortForProcess(
      processListeners,
      worktree.expectedPort,
    );
    if (!primary) {
      continue;
    }

    const key = `${normalizePath(worktree.path)}:${primary.port}`;
    if (!activeByWorktreeAndPort.has(key)) {
      activeByWorktreeAndPort.set(key, {
        branch: worktree.branch,
        port: primary.port,
        url: `http://localhost:${primary.port}`,
        active: true,
        pid: primary.pid,
        command: primary.command || null,
        path: worktree.path,
        isMain: worktree.isMain,
        isCurrent: worktree.isCurrent,
      });
    }
  }

  for (const worktree of worktrees) {
    if (!worktree.wtListening || !worktree.expectedPort) {
      continue;
    }

    const key = `${normalizePath(worktree.path)}:${worktree.expectedPort}`;
    if (activeByWorktreeAndPort.has(key)) {
      continue;
    }

    const portListener = (listenersByPort.get(worktree.expectedPort) ?? [])[0];
    activeByWorktreeAndPort.set(key, {
      branch: worktree.branch,
      port: worktree.expectedPort,
      url: worktree.expectedUrl,
      active: true,
      pid: portListener?.pid ?? null,
      command: portListener?.command || null,
      path: worktree.path,
      isMain: worktree.isMain,
      isCurrent: worktree.isCurrent,
    });
  }

  const entries = [];
  for (const worktree of worktrees) {
    const normalizedPath = normalizePath(worktree.path);
    const activeEntries = [...activeByWorktreeAndPort.entries()]
      .filter(([key]) => key.startsWith(`${normalizedPath}:`))
      .map(([, entry]) => entry)
      .sort((a, b) => a.port - b.port);

    if (activeEntries.length > 0) {
      entries.push(...activeEntries);
    } else if (includeAll) {
      entries.push({
        branch: worktree.branch,
        port: worktree.expectedPort,
        url: worktree.expectedUrl,
        active: false,
        pid: null,
        command: null,
        path: worktree.path,
        isMain: worktree.isMain,
        isCurrent: worktree.isCurrent,
      });
    }
  }

  return entries;
}

export function formatPathForDisplay(targetPath, homeDir = homedir()) {
  if (!homeDir) {
    return targetPath;
  }
  if (targetPath === homeDir) {
    return '~';
  }
  if (targetPath.startsWith(homeDir + path.sep)) {
    return `~${targetPath.slice(homeDir.length)}`;
  }
  return targetPath;
}

export function formatWorktreePortsTable(entries, options = {}) {
  const includeAll = Boolean(options.includeAll);
  const homeDir = options.homeDir ?? homedir();

  if (entries.length === 0) {
    return includeAll
      ? 'No Git worktrees found.'
      : 'No active UI worktree ports found.\nRun with --all to show all worktrees and their configured ports.';
  }

  const headers = includeAll
    ? ['STATUS', 'BRANCH', 'PORT', 'URL', 'PID', 'PATH']
    : ['BRANCH', 'PORT', 'URL', 'PID', 'PATH'];

  const rows = entries.map((entry) => {
    const branchLabel = entry.branch ?? '(detached)';
    const pidLabel = entry.pid !== null ? String(entry.pid) : '-';
    const pathLabel = formatPathForDisplay(entry.path, homeDir);
    const base = [
      branchLabel,
      String(entry.port),
      entry.url,
      pidLabel,
      pathLabel,
    ];
    return includeAll ? [entry.active ? 'active' : 'inactive', ...base] : base;
  });

  const widths = headers.map((header, columnIndex) =>
    Math.max(header.length, ...rows.map((row) => row[columnIndex].length)),
  );

  const formatRow = (cells) =>
    cells
      .map((cell, index) =>
        index === cells.length - 1 ? cell : cell.padEnd(widths[index]),
      )
      .join('  ');

  return [formatRow(headers), ...rows.map(formatRow)].join('\n');
}

export function parseCliArgs(argv) {
  const flags = {
    all: false,
    json: false,
    help: false,
  };

  for (const arg of argv) {
    if (arg === '--all' || arg === '-a') {
      flags.all = true;
    } else if (arg === '--json') {
      flags.json = true;
    } else if (arg === '--help' || arg === '-h') {
      flags.help = true;
    } else {
      return {
        ...flags,
        error: `Unknown option: ${arg}`,
      };
    }
  }

  return flags;
}

export function getHelpText() {
  return [
    'Usage: worktree-ports [options]',
    '',
    'Show active UI dev/server ports across all Git worktrees.',
    '',
    'Options:',
    '  -a, --all   Include inactive worktrees with their configured ports',
    '      --json  Output results as JSON',
    '  -h, --help  Show this help message',
  ].join('\n');
}

export function runCli(argv = process.argv.slice(2), io = {}) {
  const stdout = io.stdout ?? ((line) => process.stdout.write(`${line}\n`));
  const stderr = io.stderr ?? ((line) => process.stderr.write(`${line}\n`));

  const parsed = parseCliArgs(argv);
  if (parsed.error) {
    stderr(parsed.error);
    stderr(getHelpText());
    return 1;
  }

  if (parsed.help) {
    stdout(getHelpText());
    return 0;
  }

  try {
    const entries = collectWorktreePorts({
      ...io.collectOptions,
      includeAll: parsed.all,
    });

    if (parsed.json) {
      stdout(JSON.stringify(entries, null, 2));
    } else {
      stdout(
        formatWorktreePortsTable(entries, {
          includeAll: parsed.all,
          homeDir: io.homeDir,
        }),
      );
    }
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    stderr(`Failed to inspect worktree ports: ${message}`);
    return 1;
  }
}

const isDirectExecution =
  Boolean(process.argv[1]) &&
  defaultRealpath(process.argv[1]) ===
    defaultRealpath(fileURLToPath(import.meta.url));

if (isDirectExecution) {
  process.exitCode = runCli();
}
