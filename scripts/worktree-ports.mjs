#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { existsSync, realpathSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_DEV_PORT = 5173;
const EXTRA_PATHS = ['/opt/homebrew/bin', '/usr/local/bin'];
const MAX_ANCESTOR_DEPTH = 6;
const UI_SERVER_COMMAND_PATTERN =
  /(?:^|[\s/\\])(?:react-router(?:-serve)?|@react-router\/dev|vite|server\.js)(?:[\s/\\]|$)/i;
const PACKAGE_RUNNER_DEV_PATTERN =
  /(?:^|[\s/\\])(?:(?:npm|pnpm|yarn|bun)\s+(?:run\s+)?(?:dev|start)\b|(?:npx|pnpx|bunx|npm\s+exec)\b.*(?:react-router|vite|server\.js))/i;
const SHELL_C_WRAPPER_PATTERN =
  /^(?:[^\s]*\/)?(?:sh|bash|zsh|dash)\s+-c\s+(.+)$/i;

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
    const resolved = path.resolve(targetPath);
    const trailingSegments = [];
    let current = resolved;

    while (true) {
      const parent = path.dirname(current);
      if (parent === current) {
        return resolved;
      }
      trailingSegments.unshift(path.basename(current));
      current = parent;
      try {
        return path.join(realpathSync(current), ...trailingSegments);
      } catch {
        // Continue walking up until an existing ancestor resolves symlinks.
      }
    }
  }
}

function defaultPathExists(targetPath) {
  try {
    return existsSync(targetPath);
  } catch {
    return false;
  }
}

function resolvePathExistsFn(options) {
  if (typeof options.pathExists === 'function') {
    return options.pathExists;
  }
  if (options.execCommand) {
    return () => true;
  }
  return defaultPathExists;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isPathStartBoundary(char) {
  return (
    char === undefined ||
    /\s/.test(char) ||
    char === '"' ||
    char === "'" ||
    char === '=' ||
    char === ':'
  );
}

function isPathEndBoundary(char) {
  return (
    char === undefined ||
    char === path.sep ||
    /\s/.test(char) ||
    char === '"' ||
    char === "'" ||
    char === ':'
  );
}

function isNestedWorktreeSubpath(normalizedTarget, normalizedParent) {
  const nestedPrefix = `${normalizedParent}${path.sep}.worktrees`;
  return (
    normalizedTarget === nestedPrefix ||
    normalizedTarget.startsWith(nestedPrefix + path.sep)
  );
}

export function cleanDeletedPath(rawPath) {
  if (!rawPath || typeof rawPath !== 'string') {
    return null;
  }
  const cleaned = rawPath.replace(/\s+\(deleted\)$/, '').trim();
  return cleaned || null;
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
    const isPrunable = Boolean(item.worktree?.prunable);

    worktrees.push({
      branch,
      path: worktreePath,
      isMain: Boolean(item.worktree?.main),
      isCurrent: Boolean(item.worktree?.current),
      expectedPort,
      expectedUrl: expectedUrl ?? `http://localhost:${expectedPort}`,
      wtListening: Boolean(item.dev_server?.listening),
      ...(isPrunable ? { prunable: true } : {}),
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
      let isPrunable = false;

      for (const line of lines) {
        if (line.startsWith('worktree ')) {
          worktreePath = line.slice('worktree '.length).trim();
        } else if (line.startsWith('branch ')) {
          const ref = line.slice('branch '.length).trim();
          branch = ref.replace(/^refs\/heads\//, '') || null;
        } else if (line === 'prunable' || line.startsWith('prunable ')) {
          isPrunable = true;
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
        ...(isPrunable ? { prunable: true } : {}),
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

export function parsePsProcesses(raw) {
  const processByPid = new Map();

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }

    const withPgid = trimmed.match(/^(\d+)\s+(\d+)\s+(\d+)\s+(.+)$/);
    if (withPgid) {
      const pid = Number(withPgid[1]);
      const ppid = Number(withPgid[2]);
      const pgid = Number(withPgid[3]);
      if (Number.isInteger(pid)) {
        processByPid.set(pid, {
          pid,
          ppid: Number.isInteger(ppid) ? ppid : null,
          pgid: Number.isInteger(pgid) ? pgid : null,
          command: withPgid[4].trim(),
        });
      }
      continue;
    }

    const withPpid = trimmed.match(/^(\d+)\s+(\d+)\s+(.+)$/);
    if (withPpid) {
      const pid = Number(withPpid[1]);
      const ppid = Number(withPpid[2]);
      if (Number.isInteger(pid)) {
        processByPid.set(pid, {
          pid,
          ppid: Number.isInteger(ppid) ? ppid : null,
          pgid: null,
          command: withPpid[3].trim(),
        });
      }
      continue;
    }

    const pidOnly = trimmed.match(/^(\d+)\s+(.+)$/);
    if (pidOnly) {
      const pid = Number(pidOnly[1]);
      if (Number.isInteger(pid)) {
        processByPid.set(pid, {
          pid,
          ppid: null,
          pgid: null,
          command: pidOnly[2].trim(),
        });
      }
    }
  }

  return processByPid;
}

export function isUiServerCommand(commandLine, commandName = '') {
  const combined = [commandLine, commandName].filter(Boolean).join(' ');
  return UI_SERVER_COMMAND_PATTERN.test(combined);
}

export function isUiServerWrapperCommand(commandLine) {
  if (!commandLine || typeof commandLine !== 'string') {
    return false;
  }
  const trimmed = commandLine.trim();
  if (!trimmed) {
    return false;
  }
  if (isUiServerCommand(trimmed) || PACKAGE_RUNNER_DEV_PATTERN.test(trimmed)) {
    return true;
  }
  const shellMatch = trimmed.match(SHELL_C_WRAPPER_PATTERN);
  if (shellMatch) {
    const inner = shellMatch[1].replace(/^['"]|['"]$/g, '');
    return isUiServerCommand(inner) || PACKAGE_RUNNER_DEV_PATTERN.test(inner);
  }
  return false;
}

function pathMatchesTarget(
  candidatePath,
  targetPath,
  normalizePath = defaultRealpath,
) {
  const cleanedCandidate = cleanDeletedPath(candidatePath);
  if (!cleanedCandidate || !targetPath) {
    return false;
  }

  const normalizedCandidate = normalizePath(cleanedCandidate);
  const normalizedTarget = normalizePath(targetPath);

  if (normalizedCandidate === normalizedTarget) {
    return true;
  }

  return (
    normalizedCandidate.startsWith(normalizedTarget + path.sep) &&
    !isNestedWorktreeSubpath(normalizedCandidate, normalizedTarget)
  );
}

function commandMatchesPath(commandLine, rawTargetPath, normalizedTargetPath) {
  if (!commandLine) {
    return false;
  }

  const candidates = new Set(
    [rawTargetPath, normalizedTargetPath].filter(Boolean),
  );
  for (const candidatePath of candidates) {
    let searchFrom = 0;
    while (searchFrom < commandLine.length) {
      const idx = commandLine.indexOf(candidatePath, searchFrom);
      if (idx === -1) {
        break;
      }
      searchFrom = idx + candidatePath.length;

      const prevChar = idx > 0 ? commandLine[idx - 1] : undefined;
      const nextChar = commandLine[idx + candidatePath.length];
      if (!isPathStartBoundary(prevChar) || !isPathEndBoundary(nextChar)) {
        continue;
      }

      const after = commandLine.slice(idx + candidatePath.length);
      const nestedPrefix = `${path.sep}.worktrees`;
      if (
        after.startsWith(nestedPrefix) &&
        isPathEndBoundary(after[nestedPrefix.length])
      ) {
        continue;
      }

      return true;
    }
  }

  return false;
}

export function matchWorktreeForPath(
  targetPath,
  worktrees,
  normalizePath = defaultRealpath,
) {
  const cleanedTarget = cleanDeletedPath(targetPath);
  if (!cleanedTarget) {
    return null;
  }

  const normalizedTarget = normalizePath(cleanedTarget);
  const sorted = [...worktrees]
    .map((worktree) => ({
      worktree,
      normalizedPath: normalizePath(worktree.path),
    }))
    .sort((a, b) => b.normalizedPath.length - a.normalizedPath.length);

  for (const candidate of sorted) {
    if (
      normalizedTarget === candidate.normalizedPath ||
      (normalizedTarget.startsWith(candidate.normalizedPath + path.sep) &&
        !isNestedWorktreeSubpath(normalizedTarget, candidate.normalizedPath))
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
    if (
      commandMatchesPath(
        commandLine,
        candidate.rawPath,
        candidate.normalizedPath,
      )
    ) {
      return candidate.worktree;
    }
  }

  return null;
}

export function buildRepoContext(
  worktrees,
  cwd = process.cwd(),
  normalizePath = defaultRealpath,
) {
  const mainWorktree =
    worktrees.find((worktree) => worktree.isMain) ?? worktrees[0] ?? null;
  const rawMainPath = mainWorktree?.path ?? path.resolve(cwd);
  const normalizedMainPath = normalizePath(rawMainPath);

  const variants = [];
  const seen = new Set();
  for (const mainPath of [normalizedMainPath, rawMainPath]) {
    if (!mainPath || seen.has(mainPath)) {
      continue;
    }
    seen.add(mainPath);
    variants.push({
      mainPath,
      parentDir: path.dirname(mainPath),
      repoName: path.basename(mainPath),
    });
  }

  return {
    mainPath: normalizedMainPath,
    parentDir: path.dirname(normalizedMainPath),
    repoName: path.basename(normalizedMainPath),
    variants,
  };
}

export function extractRepoWorktreePath(
  targetPath,
  repoContext,
  normalizePath = defaultRealpath,
) {
  const cleaned = cleanDeletedPath(targetPath);
  if (!cleaned || !repoContext?.variants?.length) {
    return null;
  }

  const normalized = normalizePath(cleaned);

  for (const variant of repoContext.variants) {
    const nestedBase = `${variant.mainPath}${path.sep}.worktrees${path.sep}`;
    if (normalized.startsWith(nestedBase)) {
      const remainder = normalized.slice(nestedBase.length);
      const [worktreeName] = remainder.split(path.sep);
      if (worktreeName) {
        return path.join(repoContext.mainPath, '.worktrees', worktreeName);
      }
      return null;
    }

    const parentPrefix = variant.parentDir.endsWith(path.sep)
      ? variant.parentDir
      : `${variant.parentDir}${path.sep}`;
    if (normalized.startsWith(parentPrefix)) {
      const remainder = normalized.slice(parentPrefix.length);
      const [topSegment] = remainder.split(path.sep);
      if (
        topSegment &&
        (topSegment.startsWith(`${variant.repoName}.`) ||
          topSegment.startsWith(`${variant.repoName}-`)) &&
        topSegment.length > variant.repoName.length + 1
      ) {
        return path.join(repoContext.parentDir, topSegment);
      }
    }
  }

  return null;
}

export function extractRepoWorktreePathFromCommand(
  commandLine,
  repoContext,
  normalizePath = defaultRealpath,
) {
  if (!commandLine || !repoContext?.variants?.length) {
    return null;
  }

  for (const variant of repoContext.variants) {
    const nestedPrefix = `${variant.mainPath}${path.sep}.worktrees${path.sep}`;
    const nestedPattern = new RegExp(
      `(?:^|[\\s"'=:])(${escapeRegExp(nestedPrefix)}[^\\s"'/:;]+)(?=$|[\\s"'/:;])`,
    );
    const nestedMatch = commandLine.match(nestedPattern);
    if (nestedMatch) {
      return extractRepoWorktreePath(
        nestedMatch[1],
        repoContext,
        normalizePath,
      );
    }

    const parentPrefix = variant.parentDir.endsWith(path.sep)
      ? variant.parentDir
      : `${variant.parentDir}${path.sep}`;
    const siblingPattern = new RegExp(
      `(?:^|[\\s"'=:])(${escapeRegExp(parentPrefix)}${escapeRegExp(variant.repoName)}[.-][^\\s"'/:;]+)(?=$|[\\s"'/:;])`,
    );
    const siblingMatch = commandLine.match(siblingPattern);
    if (siblingMatch) {
      return extractRepoWorktreePath(
        siblingMatch[1],
        repoContext,
        normalizePath,
      );
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

  let processByPid = new Map();
  try {
    const psRaw = execCommand('ps', [
      '-ww',
      '-o',
      'pid=,ppid=,pgid=,command=',
      '-p',
      pidArg,
    ]);
    processByPid = parsePsProcesses(psRaw);
  } catch {
    processByPid = new Map();
  }

  return listeners.map((listener) => {
    const proc = processByPid.get(listener.pid);
    return {
      ...listener,
      cwd: cwdByPid.get(listener.pid) ?? null,
      command: proc?.command ?? listener.commandName ?? '',
      ppid: proc?.ppid ?? null,
      pgid: proc?.pgid ?? null,
    };
  });
}

function loadAncestorProcesses(seedProcesses, execCommand) {
  const processMap = new Map();
  for (const proc of seedProcesses) {
    if (proc && Number.isInteger(proc.pid) && !processMap.has(proc.pid)) {
      processMap.set(proc.pid, {
        pid: proc.pid,
        ppid: proc.ppid ?? null,
        pgid: proc.pgid ?? null,
        command: proc.command ?? '',
      });
    }
  }

  let frontier = [...processMap.values()]
    .map((proc) => proc.ppid)
    .filter(
      (ppid) => Number.isInteger(ppid) && ppid > 1 && !processMap.has(ppid),
    );

  for (
    let depth = 0;
    depth < MAX_ANCESTOR_DEPTH && frontier.length > 0;
    depth++
  ) {
    const uniquePids = [...new Set(frontier)];
    let fetched = new Map();
    try {
      const psRaw = execCommand('ps', [
        '-ww',
        '-o',
        'pid=,ppid=,pgid=,command=',
        '-p',
        uniquePids.join(','),
      ]);
      fetched = parsePsProcesses(psRaw);
    } catch {
      break;
    }

    const nextFrontier = [];
    for (const [pid, proc] of fetched.entries()) {
      if (!processMap.has(pid)) {
        processMap.set(pid, proc);
        if (
          Number.isInteger(proc.ppid) &&
          proc.ppid > 1 &&
          !processMap.has(proc.ppid)
        ) {
          nextFrontier.push(proc.ppid);
        }
      }
    }
    frontier = nextFrontier;
  }

  return processMap;
}

export function resolveProcessWrapperChain(
  listenerProcess,
  processMap,
  options = {},
) {
  const selfPid = options.selfPid ?? process.pid;
  const selfPgid = options.selfPgid ?? null;

  const base = processMap.get(listenerProcess.pid) ?? {
    pid: listenerProcess.pid,
    ppid: listenerProcess.ppid ?? null,
    pgid: listenerProcess.pgid ?? null,
    command: listenerProcess.command ?? '',
  };

  const chain = [base];
  const visited = new Set([base.pid]);
  let current = base;

  for (let depth = 0; depth < MAX_ANCESTOR_DEPTH; depth++) {
    const parentPid = current.ppid;
    if (
      !Number.isInteger(parentPid) ||
      parentPid <= 1 ||
      parentPid === selfPid ||
      visited.has(parentPid)
    ) {
      break;
    }

    const parent = processMap.get(parentPid);
    if (!parent || !isUiServerWrapperCommand(parent.command)) {
      break;
    }
    if (selfPgid !== null && parent.pid === selfPgid) {
      break;
    }

    visited.add(parent.pid);
    chain.unshift(parent);
    current = parent;
  }

  const root = chain[0];
  const detached = base.ppid === 1 || root.ppid === 1;

  return {
    chain,
    root,
    detached,
  };
}

function resolveSelfPgid(options, execCommand, processMap) {
  if (options.selfPgid !== undefined) {
    return options.selfPgid;
  }
  const selfPid = options.selfPid ?? process.pid;
  if (processMap?.has(selfPid)) {
    return processMap.get(selfPid).pgid ?? null;
  }
  if (options.execCommand) {
    return null;
  }
  try {
    const raw = execCommand('ps', [
      '-o',
      'pgid=',
      '-p',
      String(selfPid),
    ]).trim();
    const parsed = Number(raw);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  } catch {
    return null;
  }
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

function isWorktreeAvailable(worktree, pathExists) {
  return !worktree.prunable && pathExists(worktree.path);
}

export function collectWorktreePorts(options = {}) {
  const execCommand = options.execCommand ?? defaultExecCommand;
  const normalizePath = options.normalizePath ?? defaultRealpath;
  const pathExists = resolvePathExistsFn(options);
  const cwd = options.cwd ?? process.cwd();
  const includeAll = Boolean(options.includeAll);

  const worktrees = loadWorktrees(execCommand, cwd);
  const availableWorktrees = worktrees.filter((worktree) =>
    isWorktreeAvailable(worktree, pathExists),
  );
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
      availableWorktrees,
      normalizePath,
    );
    const matchedWorktree =
      matchedByCwd ??
      (isUiServerCommand(listener.command, listener.commandName)
        ? matchWorktreeInCommand(
            listener.command,
            availableWorktrees,
            normalizePath,
          )
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

  for (const worktree of availableWorktrees) {
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

export function collectOrphanedWorktreeServers(options = {}) {
  const execCommand = options.execCommand ?? defaultExecCommand;
  const normalizePath = options.normalizePath ?? defaultRealpath;
  const pathExists = resolvePathExistsFn(options);
  const cwd = options.cwd ?? process.cwd();

  const worktrees = loadWorktrees(execCommand, cwd);
  const repoContext = buildRepoContext(worktrees, cwd, normalizePath);
  const listeners = loadListeningProcesses(execCommand);

  const groupedByPid = new Map();

  for (const listener of listeners) {
    if (!isUiServerCommand(listener.command, listener.commandName)) {
      continue;
    }

    const matchedWorktree =
      matchWorktreeForPath(listener.cwd, worktrees, normalizePath) ??
      matchWorktreeInCommand(listener.command, worktrees, normalizePath);

    let orphanPath = null;
    let reason = null;
    let expectedPort = null;

    if (matchedWorktree) {
      if (isWorktreeAvailable(matchedWorktree, pathExists)) {
        continue;
      }
      orphanPath = matchedWorktree.path;
      reason = 'missing-worktree';
      expectedPort = matchedWorktree.expectedPort ?? null;
    } else {
      const inferredPath =
        extractRepoWorktreePath(listener.cwd, repoContext, normalizePath) ??
        extractRepoWorktreePathFromCommand(
          listener.command,
          repoContext,
          normalizePath,
        );

      if (!inferredPath) {
        continue;
      }
      orphanPath = inferredPath;
      reason = 'removed-worktree';
    }

    const group = groupedByPid.get(listener.pid) ?? {
      reason,
      orphanPath,
      expectedPort,
      listeners: [],
    };
    group.listeners.push(listener);
    groupedByPid.set(listener.pid, group);
  }

  const primaries = [];
  for (const group of groupedByPid.values()) {
    const primary = selectPrimaryPortForProcess(
      group.listeners,
      group.expectedPort,
    );
    if (primary) {
      primaries.push({ group, primary });
    }
  }

  const processMap = loadAncestorProcesses(
    primaries.map(({ primary }) => primary),
    execCommand,
  );

  return primaries
    .map(({ group, primary }) => {
      const { detached } = resolveProcessWrapperChain(primary, processMap, {
        selfPid: options.selfPid,
        selfPgid: options.selfPgid,
      });

      return {
        reason: group.reason,
        port: primary.port,
        url: `http://localhost:${primary.port}`,
        pid: primary.pid,
        ppid: primary.ppid ?? null,
        pgid: primary.pgid ?? null,
        detached,
        path: group.orphanPath,
        cwd: primary.cwd ?? null,
        command: primary.command || null,
      };
    })
    .sort((a, b) => a.port - b.port || a.pid - b.pid);
}

export function findWorktreeServersForPath(targetPath, options = {}) {
  const execCommand = options.execCommand ?? defaultExecCommand;
  const normalizePath = options.normalizePath ?? defaultRealpath;
  const cwd = options.cwd ?? process.cwd();

  const rawTargetPath = path.resolve(targetPath);
  const normalizedTargetPath = normalizePath(rawTargetPath);

  let expectedPort = null;
  try {
    const worktrees = loadWorktrees(execCommand, cwd);
    const matched = worktrees.find(
      (worktree) => normalizePath(worktree.path) === normalizedTargetPath,
    );
    expectedPort = matched?.expectedPort ?? null;
  } catch {
    expectedPort = null;
  }

  const listeners = loadListeningProcesses(execCommand);
  const groupedByPid = new Map();

  for (const listener of listeners) {
    if (!isUiServerCommand(listener.command, listener.commandName)) {
      continue;
    }

    const matchedByCwd = pathMatchesTarget(
      listener.cwd,
      rawTargetPath,
      normalizePath,
    );
    const matchedByCommand = commandMatchesPath(
      listener.command,
      rawTargetPath,
      normalizedTargetPath,
    );

    if (!matchedByCwd && !matchedByCommand) {
      continue;
    }

    const existing = groupedByPid.get(listener.pid) ?? [];
    existing.push(listener);
    groupedByPid.set(listener.pid, existing);
  }

  const primaries = [];
  for (const processListeners of groupedByPid.values()) {
    const primary = selectPrimaryPortForProcess(processListeners, expectedPort);
    if (primary) {
      primaries.push(primary);
    }
  }

  const processMap = loadAncestorProcesses(primaries, execCommand);

  return primaries
    .map((primary) => {
      const { detached } = resolveProcessWrapperChain(primary, processMap, {
        selfPid: options.selfPid,
        selfPgid: options.selfPgid,
      });

      return {
        pid: primary.pid,
        ppid: primary.ppid ?? null,
        pgid: primary.pgid ?? null,
        detached,
        port: primary.port,
        url: `http://localhost:${primary.port}`,
        path: normalizedTargetPath,
        cwd: primary.cwd ?? null,
        command: primary.command || null,
      };
    })
    .sort((a, b) => a.port - b.port || a.pid - b.pid);
}

export function stopServerProcesses(targets, options = {}) {
  const execCommand = options.execCommand ?? defaultExecCommand;
  const killProcess = options.killProcess ?? process.kill;
  const signal = options.signal ?? 'SIGTERM';
  const selfPid = options.selfPid ?? process.pid;

  if (!Array.isArray(targets) || targets.length === 0) {
    return { stopped: [], failed: [] };
  }

  const processMap = loadAncestorProcesses(targets, execCommand);
  const selfPgid = resolveSelfPgid(options, execCommand, processMap);
  const signaledPgids = new Set();
  const signaledPids = new Set();

  const stopped = [];
  const failed = [];

  for (const target of targets) {
    if (
      !Number.isInteger(target.pid) ||
      target.pid <= 1 ||
      target.pid === selfPid
    ) {
      failed.push({
        ...target,
        error: `Refusing to signal unsafe PID ${target.pid}`,
      });
      continue;
    }

    const { chain, root } = resolveProcessWrapperChain(target, processMap, {
      selfPid,
      selfPgid,
    });

    const canSignalProcessGroup =
      Number.isInteger(root.pgid) &&
      root.pgid > 1 &&
      root.pgid === root.pid &&
      root.pgid !== selfPid &&
      (selfPgid === null || root.pgid !== selfPgid) &&
      chain.every((proc) => proc.pgid === root.pgid);

    if (canSignalProcessGroup) {
      const pgid = root.pgid;
      if (signaledPgids.has(pgid)) {
        stopped.push({
          ...target,
          signal,
          signaledPgid: pgid,
          signaledPids: chain.map((proc) => proc.pid),
          alreadyExited: false,
        });
        continue;
      }

      try {
        killProcess(-pgid, signal);
        signaledPgids.add(pgid);
        for (const proc of chain) {
          signaledPids.add(proc.pid);
        }
        stopped.push({
          ...target,
          signal,
          signaledPgid: pgid,
          signaledPids: chain.map((proc) => proc.pid),
          alreadyExited: false,
        });
        continue;
      } catch (error) {
        if (error?.code === 'ESRCH') {
          signaledPgids.add(pgid);
          stopped.push({
            ...target,
            signal,
            signaledPgid: pgid,
            signaledPids: chain.map((proc) => proc.pid),
            alreadyExited: true,
          });
          continue;
        }
      }
    }

    const safePids = chain
      .map((proc) => proc.pid)
      .filter((pid) => Number.isInteger(pid) && pid > 1 && pid !== selfPid);

    const sentPids = [];
    let allAlreadyExited = true;
    let lastError = null;

    for (const pid of safePids) {
      if (signaledPids.has(pid)) {
        sentPids.push(pid);
        allAlreadyExited = false;
        continue;
      }

      try {
        killProcess(pid, signal);
        signaledPids.add(pid);
        sentPids.push(pid);
        allAlreadyExited = false;
      } catch (error) {
        if (error?.code === 'ESRCH') {
          signaledPids.add(pid);
          continue;
        }
        lastError = error;
      }
    }

    if (lastError && sentPids.length === 0) {
      failed.push({
        ...target,
        signal,
        error:
          lastError instanceof Error ? lastError.message : String(lastError),
      });
    } else {
      stopped.push({
        ...target,
        signal,
        signaledPgid: null,
        signaledPids: sentPids.length > 0 ? sentPids : safePids,
        alreadyExited: allAlreadyExited,
      });
    }
  }

  return { stopped, failed };
}

export function killOrphanedWorktreeServers(options = {}) {
  const orphans = collectOrphanedWorktreeServers(options);
  return stopServerProcesses(orphans, options);
}

export function stopWorktreeServersByPath(targetPath, options = {}) {
  const normalizePath = options.normalizePath ?? defaultRealpath;
  const resolvedTargetPath = normalizePath(path.resolve(targetPath));
  const matches = findWorktreeServersForPath(targetPath, options);
  const { stopped, failed } = stopServerProcesses(matches, options);

  return {
    targetPath: resolvedTargetPath,
    stopped,
    failed,
  };
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

function formatTable(headers, rows) {
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

  return formatTable(headers, rows);
}

export function formatOrphanedServersTable(orphans, options = {}) {
  const homeDir = options.homeDir ?? homedir();

  if (orphans.length === 0) {
    return 'No orphaned UI servers found for this repository.';
  }

  const headers = ['REASON', 'PORT', 'URL', 'PID', 'PPID', 'DETACHED', 'PATH'];
  const rows = orphans.map((entry) => [
    entry.reason,
    String(entry.port),
    entry.url,
    String(entry.pid),
    entry.ppid !== null ? String(entry.ppid) : '-',
    entry.detached ? 'yes' : 'no',
    formatPathForDisplay(entry.path, homeDir),
  ]);

  return formatTable(headers, rows);
}

export function formatStopResult(result, options = {}) {
  const homeDir = options.homeDir ?? homedir();
  const mode = options.mode ?? 'orphans';
  const targetLabel = options.targetPath
    ? formatPathForDisplay(options.targetPath, homeDir)
    : null;

  const lines = [];

  if (result.stopped.length === 0 && result.failed.length === 0) {
    return mode === 'stop-path'
      ? `No running UI server found for ${targetLabel}.`
      : 'No orphaned UI servers found to stop.';
  }

  if (result.stopped.length > 0) {
    const noun = result.stopped.length === 1 ? 'server' : 'servers';
    const heading =
      mode === 'stop-path'
        ? `Stopped ${result.stopped.length} UI ${noun} for ${targetLabel}:`
        : `Stopped ${result.stopped.length} orphaned UI ${noun}:`;
    lines.push(heading);

    for (const item of result.stopped) {
      const details = [
        `port ${item.port}`,
        ...(item.reason ? [item.reason] : []),
        formatPathForDisplay(item.path, homeDir),
      ].join(', ');
      const targetDetail = item.alreadyExited
        ? 'already exited'
        : item.signaledPgid !== null
          ? `${item.signal} -> pgid ${item.signaledPgid}`
          : `${item.signal} -> pid ${item.signaledPids.join(', ')}`;
      lines.push(`- PID ${item.pid} (${details}) [${targetDetail}]`);
    }
  }

  if (result.failed.length > 0) {
    const noun = result.failed.length === 1 ? 'server' : 'servers';
    lines.push(`Failed to stop ${result.failed.length} UI ${noun}:`);
    for (const item of result.failed) {
      lines.push(
        `- PID ${item.pid} (port ${item.port}, ${formatPathForDisplay(item.path, homeDir)}): ${item.error}`,
      );
    }
  }

  return lines.join('\n');
}

export function parseCliArgs(argv) {
  const flags = {
    all: false,
    json: false,
    orphans: false,
    killOrphans: false,
    stopPath: null,
    help: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--all' || arg === '-a') {
      flags.all = true;
    } else if (arg === '--json') {
      flags.json = true;
    } else if (arg === '--orphans') {
      flags.orphans = true;
    } else if (arg === '--kill-orphans') {
      flags.killOrphans = true;
    } else if (arg === '--stop-path') {
      const next = argv[i + 1];
      if (!next || next.startsWith('-')) {
        return {
          ...flags,
          error: 'Missing value for --stop-path',
        };
      }
      flags.stopPath = next;
      i++;
    } else if (arg.startsWith('--stop-path=')) {
      const value = arg.slice('--stop-path='.length);
      if (!value) {
        return {
          ...flags,
          error: 'Missing value for --stop-path',
        };
      }
      flags.stopPath = value;
    } else if (arg === '--help' || arg === '-h') {
      flags.help = true;
    } else {
      return {
        ...flags,
        error: `Unknown option: ${arg}`,
      };
    }
  }

  if (flags.stopPath && (flags.orphans || flags.killOrphans)) {
    return {
      ...flags,
      error: 'Cannot combine --stop-path with --orphans or --kill-orphans',
    };
  }

  if (flags.all && (flags.orphans || flags.killOrphans || flags.stopPath)) {
    return {
      ...flags,
      error:
        'Cannot combine --all with --orphans, --kill-orphans, or --stop-path',
    };
  }

  return flags;
}

export function getHelpText() {
  return [
    'Usage: worktree-ports [options]',
    '',
    'Show active UI dev/server ports across all Git worktrees,',
    'or inspect and stop orphaned UI servers for this repository.',
    '',
    'Options:',
    '  -a, --all                Include inactive worktrees with their configured ports',
    '      --orphans            Show orphaned UI servers belonging to this repository',
    '      --kill-orphans       Stop detected orphaned UI servers with SIGTERM',
    '      --stop-path <path>   Stop any UI server running for a specific worktree path',
    '      --json               Output results as JSON',
    '  -h, --help               Show this help message',
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
    if (parsed.stopPath) {
      const result = stopWorktreeServersByPath(
        parsed.stopPath,
        io.collectOptions,
      );
      if (parsed.json) {
        stdout(JSON.stringify(result, null, 2));
      } else {
        stdout(
          formatStopResult(result, {
            mode: 'stop-path',
            targetPath: result.targetPath,
            homeDir: io.homeDir,
          }),
        );
      }
      return result.failed.length > 0 ? 1 : 0;
    }

    if (parsed.killOrphans) {
      const result = killOrphanedWorktreeServers(io.collectOptions);
      if (parsed.json) {
        stdout(JSON.stringify(result, null, 2));
      } else {
        stdout(
          formatStopResult(result, {
            mode: 'orphans',
            homeDir: io.homeDir,
          }),
        );
      }
      return result.failed.length > 0 ? 1 : 0;
    }

    if (parsed.orphans) {
      const orphans = collectOrphanedWorktreeServers(io.collectOptions);
      if (parsed.json) {
        stdout(JSON.stringify(orphans, null, 2));
      } else {
        stdout(
          formatOrphanedServersTable(orphans, {
            homeDir: io.homeDir,
          }),
        );
      }
      return 0;
    }

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
