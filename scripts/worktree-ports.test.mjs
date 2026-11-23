import { describe, expect, it, vi } from 'vitest';

import {
  buildRepoContext,
  cleanDeletedPath,
  collectOrphanedWorktreeServers,
  collectWorktreePorts,
  extractRepoWorktreePath,
  extractRepoWorktreePathFromCommand,
  findWorktreeServersForPath,
  formatOrphanedServersTable,
  formatPathForDisplay,
  formatStopResult,
  formatWorktreePortsTable,
  getHelpText,
  hashBranchToPort,
  isLoopbackAddress,
  isUiServerCommand,
  isUiServerWrapperCommand,
  killOrphanedWorktreeServers,
  matchWorktreeForPath,
  parseCliArgs,
  parseGitWorktreeList,
  parseLsofCwd,
  parseLsofListeners,
  parsePortFromUrl,
  parsePsCommands,
  parsePsProcesses,
  parseWtListOutput,
  resolveProcessWrapperChain,
  runCli,
  selectPrimaryPortForProcess,
  stopServerProcesses,
  stopWorktreeServersByPath,
} from './worktree-ports.mjs';

describe('worktree-ports', () => {
  describe('hashBranchToPort', () => {
    it('returns a deterministic port between 10000 and 19999', () => {
      const portA = hashBranchToPort('feat/issue-41-comp-score-tracking');
      const portB = hashBranchToPort('feat/issue-41-comp-score-tracking');
      const portOther = hashBranchToPort('main');

      expect(portA).toBe(portB);
      expect(portA).toBeGreaterThanOrEqual(10000);
      expect(portA).toBeLessThan(20000);
      expect(portOther).not.toBe(portA);
    });
  });

  describe('parsePortFromUrl', () => {
    it('extracts valid ports and rejects invalid URLs', () => {
      expect(parsePortFromUrl('http://localhost:12107')).toBe(12107);
      expect(parsePortFromUrl('http://127.0.0.1:5173/profile')).toBe(5173);
      expect(parsePortFromUrl('http://localhost')).toBeNull();
      expect(parsePortFromUrl('not-a-url')).toBeNull();
      expect(parsePortFromUrl(null)).toBeNull();
    });
  });

  describe('parseWtListOutput', () => {
    it('parses Worktrunk JSON schema with dev_server status', () => {
      const raw = JSON.stringify({
        schema: 2,
        items: [
          {
            branch: 'main',
            worktree: {
              path: '/repo/oneTrickUI',
              main: true,
              current: true,
            },
            dev_server: {
              url: 'http://localhost:12107',
              listening: true,
            },
          },
          {
            branch: 'branch-without-worktree',
            worktree: null,
          },
        ],
      });

      expect(parseWtListOutput(raw)).toEqual([
        {
          branch: 'main',
          path: '/repo/oneTrickUI',
          isMain: true,
          isCurrent: true,
          expectedPort: 12107,
          expectedUrl: 'http://localhost:12107',
          wtListening: true,
        },
      ]);
    });

    it('marks prunable worktrees from Worktrunk JSON output', () => {
      const raw = JSON.stringify({
        items: [
          {
            branch: 'feat/stale',
            worktree: {
              path: '/repo/oneTrickUI/.worktrees/feat-stale',
              main: false,
              current: false,
              prunable: {
                reason: 'gitdir file points to non-existent location',
              },
            },
          },
        ],
      });

      expect(parseWtListOutput(raw)).toEqual([
        expect.objectContaining({
          branch: 'feat/stale',
          path: '/repo/oneTrickUI/.worktrees/feat-stale',
          prunable: true,
        }),
      ]);
    });
  });

  describe('parseGitWorktreeList', () => {
    it('parses porcelain output including detached and prunable worktrees', () => {
      const raw = [
        'worktree /repo/oneTrickUI',
        'HEAD abc123',
        'branch refs/heads/main',
        '',
        'worktree /repo/oneTrickUI.detached',
        'HEAD def456',
        'detached',
        '',
        'worktree /repo/oneTrickUI.prunable',
        'HEAD 7890ab',
        'branch refs/heads/feat/gone',
        'prunable gitdir file points to non-existent location',
      ].join('\n');

      const result = parseGitWorktreeList(raw, '/repo/oneTrickUI/app');

      expect(result).toHaveLength(3);
      expect(result[0]).toMatchObject({
        branch: 'main',
        path: '/repo/oneTrickUI',
        isMain: true,
        isCurrent: true,
        expectedPort: hashBranchToPort('main'),
      });
      expect(result[1]).toMatchObject({
        branch: null,
        path: '/repo/oneTrickUI.detached',
        isMain: false,
        isCurrent: false,
        expectedPort: 5173,
        expectedUrl: 'http://localhost:5173',
      });
      expect(result[2]).toMatchObject({
        branch: 'feat/gone',
        path: '/repo/oneTrickUI.prunable',
        prunable: true,
      });
    });
  });

  describe('lsof and ps parsers', () => {
    it('parses IPv4, IPv6, and wildcard TCP listeners', () => {
      const raw = [
        'p1001',
        'cnode',
        'f20',
        'n127.0.0.1:12107',
        'f21',
        'n[::1]:12107',
        'p1002',
        'cnode',
        'f18',
        'n*:3000',
      ].join('\n');

      expect(parseLsofListeners(raw)).toEqual([
        {
          pid: 1001,
          commandName: 'node',
          port: 12107,
          address: '127.0.0.1:12107',
        },
        { pid: 1001, commandName: 'node', port: 12107, address: '[::1]:12107' },
        { pid: 1002, commandName: 'node', port: 3000, address: '*:3000' },
      ]);
    });

    it('parses lsof cwd output into a pid map', () => {
      const raw = [
        'p1001',
        'fcwd',
        'n/repo/oneTrickUI',
        'p1002',
        'fcwd',
        'n/repo/oneTrickUI.feat-comp',
      ].join('\n');

      const cwdByPid = parseLsofCwd(raw);
      expect(cwdByPid.get(1001)).toBe('/repo/oneTrickUI');
      expect(cwdByPid.get(1002)).toBe('/repo/oneTrickUI.feat-comp');
    });

    it('parses ps pid and full command output', () => {
      const raw = [
        ' 1001 node /repo/oneTrickUI/node_modules/.bin/react-router dev',
        '1002 node ./server.js',
      ].join('\n');

      const commands = parsePsCommands(raw);
      expect(commands.get(1001)).toBe(
        'node /repo/oneTrickUI/node_modules/.bin/react-router dev',
      );
      expect(commands.get(1002)).toBe('node ./server.js');
    });

    it('parses ps pid, ppid, pgid, and command output with graceful fallbacks', () => {
      const raw = [
        ' 7901     1  7897 node ./node_modules/.bin/vite --port 5173',
        '65364 65363 65339 node /repo/oneTrickUI/node_modules/.bin/react-router dev',
        ' 4100 4099 node ./server.js',
        ' 4200 node ./node_modules/.bin/vite',
      ].join('\n');

      const processes = parsePsProcesses(raw);
      expect(processes.get(7901)).toEqual({
        pid: 7901,
        ppid: 1,
        pgid: 7897,
        command: 'node ./node_modules/.bin/vite --port 5173',
      });
      expect(processes.get(65364)).toEqual({
        pid: 65364,
        ppid: 65363,
        pgid: 65339,
        command: 'node /repo/oneTrickUI/node_modules/.bin/react-router dev',
      });
      expect(processes.get(4100)).toEqual({
        pid: 4100,
        ppid: 4099,
        pgid: null,
        command: 'node ./server.js',
      });
      expect(processes.get(4200)).toEqual({
        pid: 4200,
        ppid: null,
        pgid: null,
        command: 'node ./node_modules/.bin/vite',
      });
    });
  });

  describe('command classifiers', () => {
    it('matches react-router, vite, and server.js while ignoring unrelated tools', () => {
      expect(
        isUiServerCommand('node /repo/node_modules/.bin/react-router dev'),
      ).toBe(true);
      expect(isUiServerCommand('node /repo/node_modules/.bin/vite')).toBe(true);
      expect(isUiServerCommand('node ./server.js')).toBe(true);
      expect(isUiServerCommand('node /repo/node_modules/.bin/vitest')).toBe(
        false,
      );
      expect(isUiServerCommand('node /repo/scripts/inspector.js')).toBe(false);
    });

    it('identifies safe UI server wrapper parents without matching general shells or tools', () => {
      expect(isUiServerWrapperCommand('npm run dev')).toBe(true);
      expect(isUiServerWrapperCommand('/opt/homebrew/bin/npm run start')).toBe(
        true,
      );
      expect(isUiServerWrapperCommand('pnpm dev')).toBe(true);
      expect(isUiServerWrapperCommand('npx react-router dev')).toBe(true);
      expect(isUiServerWrapperCommand('sh -c "npm run dev"')).toBe(true);
      expect(
        isUiServerWrapperCommand(
          'node /repo/oneTrickUI/node_modules/.bin/react-router dev',
        ),
      ).toBe(true);

      expect(isUiServerWrapperCommand('-zsh')).toBe(false);
      expect(isUiServerWrapperCommand('/bin/bash')).toBe(false);
      expect(isUiServerWrapperCommand('npm run test')).toBe(false);
      expect(isUiServerWrapperCommand('wt remove feat/old')).toBe(false);
      expect(isUiServerWrapperCommand('sh -c "echo hello"')).toBe(false);
    });
  });

  describe('worktree path matching and repo context extraction', () => {
    it('cleans deleted suffixes from lsof paths', () => {
      expect(cleanDeletedPath('/repo/oneTrickUI.feat-old (deleted)')).toBe(
        '/repo/oneTrickUI.feat-old',
      );
      expect(cleanDeletedPath('/repo/oneTrickUI')).toBe('/repo/oneTrickUI');
      expect(cleanDeletedPath(null)).toBeNull();
    });

    it('matches the most specific nested worktree without false sibling or deleted nested matches', () => {
      const worktrees = [
        { branch: 'main', path: '/repo/oneTrickUI' },
        {
          branch: 'feat/nested',
          path: '/repo/oneTrickUI/.worktrees/feat-nested',
        },
        {
          branch: 'feat/sibling',
          path: '/repo/oneTrickUI.feat-sibling',
        },
      ];
      const identity = (p) => p;

      expect(
        matchWorktreeForPath(
          '/repo/oneTrickUI/.worktrees/feat-nested',
          worktrees,
          identity,
        )?.branch,
      ).toBe('feat/nested');

      expect(
        matchWorktreeForPath(
          '/repo/oneTrickUI.feat-sibling/app',
          worktrees,
          identity,
        )?.branch,
      ).toBe('feat/sibling');

      expect(
        matchWorktreeForPath(
          '/repo/oneTrickUI/.worktrees/feat-removed',
          worktrees,
          identity,
        ),
      ).toBeNull();

      expect(
        matchWorktreeForPath('/repo/oneTrickUI-other', worktrees, identity),
      ).toBeNull();
    });

    it('extracts repo worktree paths from cwd and command lines while ignoring unrelated repos', () => {
      const identity = (p) => p;
      const repoContext = buildRepoContext(
        [
          {
            branch: 'main',
            path: '/Users/dev/WebstormProjects/oneTrickUI',
            isMain: true,
          },
        ],
        '/Users/dev/WebstormProjects/oneTrickUI',
        identity,
      );

      expect(
        extractRepoWorktreePath(
          '/Users/dev/WebstormProjects/oneTrickUI.feat-old/app',
          repoContext,
          identity,
        ),
      ).toBe('/Users/dev/WebstormProjects/oneTrickUI.feat-old');

      expect(
        extractRepoWorktreePath(
          '/Users/dev/WebstormProjects/oneTrickUI-ot-99 (deleted)',
          repoContext,
          identity,
        ),
      ).toBe('/Users/dev/WebstormProjects/oneTrickUI-ot-99');

      expect(
        extractRepoWorktreePath(
          '/Users/dev/WebstormProjects/oneTrickUI/.worktrees/feat-issue-38/app',
          repoContext,
          identity,
        ),
      ).toBe('/Users/dev/WebstormProjects/oneTrickUI/.worktrees/feat-issue-38');

      expect(
        extractRepoWorktreePath(
          '/Users/dev/WebstormProjects/landing-page',
          repoContext,
          identity,
        ),
      ).toBeNull();
      expect(
        extractRepoWorktreePath(
          '/Users/dev/WebstormProjects/oneTrickUI2',
          repoContext,
          identity,
        ),
      ).toBeNull();
      expect(
        extractRepoWorktreePath(
          '/Users/dev/WebstormProjects/oneTrickUI',
          repoContext,
          identity,
        ),
      ).toBeNull();
      expect(
        extractRepoWorktreePath(
          '/Users/dev/OtherProjects/oneTrickUI.feat-old',
          repoContext,
          identity,
        ),
      ).toBeNull();

      expect(
        extractRepoWorktreePathFromCommand(
          'node --conditions=development /Users/dev/WebstormProjects/oneTrickUI.feat-gone/node_modules/.bin/react-router dev',
          repoContext,
          identity,
        ),
      ).toBe('/Users/dev/WebstormProjects/oneTrickUI.feat-gone');

      expect(
        extractRepoWorktreePathFromCommand(
          'node /Users/dev/WebstormProjects/oneTrickUI/.worktrees/feat-gone/server.js',
          repoContext,
          identity,
        ),
      ).toBe('/Users/dev/WebstormProjects/oneTrickUI/.worktrees/feat-gone');

      expect(
        extractRepoWorktreePathFromCommand(
          'node /Users/dev/WebstormProjects/landing-page/node_modules/.bin/vite --port 5173',
          repoContext,
          identity,
        ),
      ).toBeNull();
    });
  });

  describe('isLoopbackAddress and selectPrimaryPortForProcess', () => {
    it('identifies IPv4 and IPv6 loopback addresses', () => {
      expect(isLoopbackAddress('127.0.0.1:12107')).toBe(true);
      expect(isLoopbackAddress('[::1]:15437')).toBe(true);
      expect(isLoopbackAddress('*:4206')).toBe(false);
    });

    it('prefers expected port over auxiliary plugin ports on the same PID', () => {
      const selected = selectPrimaryPortForProcess(
        [
          { pid: 57377, port: 4206, address: '*:4206' },
          { pid: 57377, port: 12107, address: '[::1]:12107' },
        ],
        12107,
      );

      expect(selected?.port).toBe(12107);
    });

    it('prefers auto-incremented Vite port near expectedPort over wildcard devtools port', () => {
      const selected = selectPrimaryPortForProcess(
        [
          { pid: 57377, port: 4206, address: '*:4206' },
          { pid: 57377, port: 12108, address: '[::1]:12108' },
        ],
        12107,
      );

      expect(selected?.port).toBe(12108);
    });

    it('prefers loopback custom PORT over wildcard devtools port on the same PID', () => {
      const selected = selectPrimaryPortForProcess(
        [
          { pid: 65364, port: 62781, address: '*:62781' },
          { pid: 65364, port: 4321, address: '[::1]:4321' },
        ],
        15437,
      );

      expect(selected?.port).toBe(4321);
    });
  });

  describe('collectWorktreePorts', () => {
    it('detects active worktree servers including custom ports and filters auxiliary plugin ports', () => {
      const wtJson = JSON.stringify({
        items: [
          {
            branch: 'main',
            worktree: { path: '/repo/oneTrickUI', main: true, current: true },
            dev_server: { url: 'http://localhost:12107', listening: true },
          },
          {
            branch: 'feat/comp',
            worktree: {
              path: '/repo/oneTrickUI.feat-comp',
              main: false,
              current: false,
            },
            dev_server: { url: 'http://localhost:15437', listening: false },
          },
          {
            branch: 'feat/idle',
            worktree: {
              path: '/repo/oneTrickUI.feat-idle',
              main: false,
              current: false,
            },
            dev_server: { url: 'http://localhost:13546', listening: false },
          },
        ],
      });

      const execCommand = vi.fn((file, args) => {
        if (file === 'wt') {
          return wtJson;
        }
        if (file === 'lsof' && args.includes('-iTCP')) {
          return [
            'p4100',
            'cnode',
            'f19',
            'n*:4206',
            'f20',
            'n127.0.0.1:12107',
            'f21',
            'n[::1]:12107',
            'p4200',
            'cnode',
            'f22',
            'n*:62781',
            'f23',
            'n[::1]:4321',
            'p4300',
            'cnode',
            'f24',
            'n127.0.0.1:9229',
          ].join('\n');
        }
        if (file === 'lsof' && args.includes('cwd')) {
          return [
            'p4100',
            'fcwd',
            'n/repo/oneTrickUI',
            'p4200',
            'fcwd',
            'n/repo/oneTrickUI.feat-comp',
            'p4300',
            'fcwd',
            'n/repo/oneTrickUI.feat-idle',
          ].join('\n');
        }
        if (file === 'ps') {
          return [
            '4100 node /repo/oneTrickUI/node_modules/.bin/react-router dev',
            '4200 node /repo/oneTrickUI.feat-comp/node_modules/.bin/react-router dev',
            '4300 node --inspect unrelated.js',
          ].join('\n');
        }
        throw new Error(`Unexpected command: ${file} ${args.join(' ')}`);
      });

      const activeOnly = collectWorktreePorts({
        execCommand,
        normalizePath: (p) => p,
        includeAll: false,
      });

      expect(activeOnly).toEqual([
        {
          branch: 'main',
          port: 12107,
          url: 'http://localhost:12107',
          active: true,
          pid: 4100,
          command: 'node /repo/oneTrickUI/node_modules/.bin/react-router dev',
          path: '/repo/oneTrickUI',
          isMain: true,
          isCurrent: true,
        },
        {
          branch: 'feat/comp',
          port: 4321,
          url: 'http://localhost:4321',
          active: true,
          pid: 4200,
          command:
            'node /repo/oneTrickUI.feat-comp/node_modules/.bin/react-router dev',
          path: '/repo/oneTrickUI.feat-comp',
          isMain: false,
          isCurrent: false,
        },
      ]);

      const allEntries = collectWorktreePorts({
        execCommand,
        normalizePath: (p) => p,
        includeAll: true,
      });

      expect(allEntries).toHaveLength(3);
      expect(allEntries[2]).toEqual({
        branch: 'feat/idle',
        port: 13546,
        url: 'http://localhost:13546',
        active: false,
        pid: null,
        command: null,
        path: '/repo/oneTrickUI.feat-idle',
        isMain: false,
        isCurrent: false,
      });
    });

    it('falls back to git worktree list when wt CLI is unavailable', () => {
      const execCommand = vi.fn((file, args) => {
        if (file === 'wt') {
          throw new Error('wt not found');
        }
        if (file === 'git') {
          return [
            'worktree /repo/oneTrickUI',
            'HEAD abc123',
            'branch refs/heads/main',
          ].join('\n');
        }
        if (file === 'lsof' && args.includes('-iTCP')) {
          return ['p5001', 'cnode', 'f19', 'n127.0.0.1:5173'].join('\n');
        }
        if (file === 'lsof' && args.includes('cwd')) {
          return ['p5001', 'fcwd', 'n/repo/oneTrickUI'].join('\n');
        }
        if (file === 'ps') {
          return '5001 node ./node_modules/.bin/vite';
        }
        throw new Error(`Unexpected command: ${file}`);
      });

      const entries = collectWorktreePorts({
        execCommand,
        normalizePath: (p) => p,
        cwd: '/repo/oneTrickUI',
      });

      expect(entries).toHaveLength(1);
      expect(entries[0]).toMatchObject({
        branch: 'main',
        port: 5173,
        url: 'http://localhost:5173',
        active: true,
        pid: 5001,
      });
    });

    it('includes wt dev_server.listening entries even when lsof is unavailable', () => {
      const wtJson = JSON.stringify({
        items: [
          {
            branch: 'main',
            worktree: { path: '/repo/oneTrickUI', main: true, current: true },
            dev_server: { url: 'http://localhost:12107', listening: true },
          },
        ],
      });

      const execCommand = vi.fn((file) => {
        if (file === 'wt') {
          return wtJson;
        }
        throw new Error('lsof unavailable');
      });

      const entries = collectWorktreePorts({
        execCommand,
        normalizePath: (p) => p,
      });

      expect(entries).toEqual([
        {
          branch: 'main',
          port: 12107,
          url: 'http://localhost:12107',
          active: true,
          pid: null,
          command: null,
          path: '/repo/oneTrickUI',
          isMain: true,
          isCurrent: true,
        },
      ]);
    });

    it('excludes prunable or missing-on-disk worktree servers from active worktree ports', () => {
      const wtJson = JSON.stringify({
        items: [
          {
            branch: 'main',
            worktree: { path: '/repo/oneTrickUI', main: true, current: true },
            dev_server: { url: 'http://localhost:12107', listening: false },
          },
          {
            branch: 'feat/prunable',
            worktree: {
              path: '/repo/oneTrickUI/.worktrees/feat-prunable',
              main: false,
              current: false,
              prunable: {
                reason: 'gitdir file points to non-existent location',
              },
            },
          },
        ],
      });

      const execCommand = vi.fn((file, args) => {
        if (file === 'wt') return wtJson;
        if (file === 'lsof' && args.includes('-iTCP')) {
          return ['p7001', 'cnode', 'f19', 'n127.0.0.1:14567'].join('\n');
        }
        if (file === 'lsof' && args.includes('cwd')) {
          return [
            'p7001',
            'fcwd',
            'n/repo/oneTrickUI/.worktrees/feat-prunable',
          ].join('\n');
        }
        if (file === 'ps') {
          return '7001 1 7001 node /repo/oneTrickUI/.worktrees/feat-prunable/node_modules/.bin/react-router dev';
        }
        throw new Error(`Unexpected command: ${file}`);
      });

      expect(
        collectWorktreePorts({
          execCommand,
          normalizePath: (p) => p,
          includeAll: false,
        }),
      ).toEqual([]);
    });
  });

  describe('collectOrphanedWorktreeServers', () => {
    it('detects removed and missing worktree UI servers for this repo while ignoring active worktrees and unrelated repos', () => {
      const wtJson = JSON.stringify({
        items: [
          {
            branch: 'main',
            worktree: {
              path: '/Users/dev/WebstormProjects/oneTrickUI',
              main: true,
              current: true,
            },
            dev_server: { url: 'http://localhost:12107', listening: true },
          },
          {
            branch: 'feat/prunable',
            worktree: {
              path: '/Users/dev/WebstormProjects/oneTrickUI/.worktrees/feat-prunable',
              main: false,
              current: false,
              prunable: { reason: 'missing' },
            },
            dev_server: { url: 'http://localhost:14100', listening: false },
          },
          {
            branch: 'feat/missing-dir',
            worktree: {
              path: '/Users/dev/WebstormProjects/oneTrickUI.feat-missing-dir',
              main: false,
              current: false,
            },
            dev_server: { url: 'http://localhost:14200', listening: false },
          },
        ],
      });

      const psTable = new Map([
        [
          1001,
          '1001 1000 1000 node /Users/dev/WebstormProjects/oneTrickUI/node_modules/.bin/react-router dev',
        ],
        [
          2001,
          '2001 1 2000 node ./node_modules/.bin/vite --host localhost --port 5173',
        ],
        [
          3001,
          '3001 3000 2999 node --conditions=development /Users/dev/WebstormProjects/oneTrickUI.feat-removed/node_modules/.bin/react-router dev',
        ],
        [
          3000,
          '3000 2999 2999 node /Users/dev/WebstormProjects/oneTrickUI.feat-removed/node_modules/.bin/react-router dev',
        ],
        [2999, '2999 1 2999 npm run dev'],
        [
          3002,
          '3002 5555 5555 node /Users/dev/WebstormProjects/oneTrickUI-ot-99/node_modules/.bin/vite',
        ],
        [5555, '5555 5000 5000 -zsh'],
        [
          3003,
          '3003 1 3003 node /Users/dev/WebstormProjects/oneTrickUI/.worktrees/feat-prunable/server.js',
        ],
        [
          3004,
          '3004 1 3004 node /Users/dev/WebstormProjects/oneTrickUI.feat-missing-dir/node_modules/.bin/react-router dev',
        ],
        [3005, '3005 1 3005 node --inspect unrelated.js'],
      ]);

      const execCommand = vi.fn((file, args) => {
        if (file === 'wt') return wtJson;
        if (file === 'lsof' && args.includes('-iTCP')) {
          return [
            'p1001',
            'cnode',
            'f19',
            'n[::1]:12107',
            'p2001',
            'cnode',
            'f20',
            'n127.0.0.1:5173',
            'p3001',
            'cnode',
            'f21',
            'n*:4206',
            'f22',
            'n[::1]:15100',
            'p3002',
            'cnode',
            'f23',
            'n127.0.0.1:15200',
            'p3003',
            'cnode',
            'f24',
            'n*:14100',
            'p3004',
            'cnode',
            'f25',
            'n[::1]:14200',
            'p3005',
            'cnode',
            'f26',
            'n127.0.0.1:9229',
          ].join('\n');
        }
        if (file === 'lsof' && args.includes('cwd')) {
          return [
            'p1001',
            'fcwd',
            'n/Users/dev/WebstormProjects/oneTrickUI',
            'p2001',
            'fcwd',
            'n/Users/dev/WebstormProjects/landing-page',
            // Note: 3001 has no cwd entry (simulating unlinked directory on macOS)
            'p3002',
            'fcwd',
            'n/Users/dev/WebstormProjects/oneTrickUI-ot-99 (deleted)',
            'p3003',
            'fcwd',
            'n/Users/dev/WebstormProjects/oneTrickUI/.worktrees/feat-prunable',
            'p3004',
            'fcwd',
            'n/Users/dev/WebstormProjects/oneTrickUI.feat-missing-dir',
            'p3005',
            'fcwd',
            'n/Users/dev/WebstormProjects/oneTrickUI.feat-removed',
          ].join('\n');
        }
        if (file === 'ps') {
          const pIndex = args.indexOf('-p');
          const pids = args[pIndex + 1].split(',').map(Number);
          return pids
            .map((pid) => psTable.get(pid))
            .filter(Boolean)
            .join('\n');
        }
        throw new Error(`Unexpected command: ${file} ${args.join(' ')}`);
      });

      const existingDirs = new Set(['/Users/dev/WebstormProjects/oneTrickUI']);
      const orphans = collectOrphanedWorktreeServers({
        execCommand,
        normalizePath: (p) => p,
        pathExists: (p) => existingDirs.has(p),
      });

      expect(orphans).toEqual([
        {
          reason: 'missing-worktree',
          port: 14100,
          url: 'http://localhost:14100',
          pid: 3003,
          ppid: 1,
          pgid: 3003,
          detached: true,
          path: '/Users/dev/WebstormProjects/oneTrickUI/.worktrees/feat-prunable',
          cwd: '/Users/dev/WebstormProjects/oneTrickUI/.worktrees/feat-prunable',
          command:
            'node /Users/dev/WebstormProjects/oneTrickUI/.worktrees/feat-prunable/server.js',
        },
        {
          reason: 'missing-worktree',
          port: 14200,
          url: 'http://localhost:14200',
          pid: 3004,
          ppid: 1,
          pgid: 3004,
          detached: true,
          path: '/Users/dev/WebstormProjects/oneTrickUI.feat-missing-dir',
          cwd: '/Users/dev/WebstormProjects/oneTrickUI.feat-missing-dir',
          command:
            'node /Users/dev/WebstormProjects/oneTrickUI.feat-missing-dir/node_modules/.bin/react-router dev',
        },
        {
          reason: 'removed-worktree',
          port: 15100,
          url: 'http://localhost:15100',
          pid: 3001,
          ppid: 3000,
          pgid: 2999,
          detached: true,
          path: '/Users/dev/WebstormProjects/oneTrickUI.feat-removed',
          cwd: null,
          command:
            'node --conditions=development /Users/dev/WebstormProjects/oneTrickUI.feat-removed/node_modules/.bin/react-router dev',
        },
        {
          reason: 'removed-worktree',
          port: 15200,
          url: 'http://localhost:15200',
          pid: 3002,
          ppid: 5555,
          pgid: 5555,
          detached: false,
          path: '/Users/dev/WebstormProjects/oneTrickUI-ot-99',
          cwd: '/Users/dev/WebstormProjects/oneTrickUI-ot-99 (deleted)',
          command:
            'node /Users/dev/WebstormProjects/oneTrickUI-ot-99/node_modules/.bin/vite',
        },
      ]);
    });
  });

  describe('process stopping and --stop-path', () => {
    it('walks wrapper parents up to npm run dev and stops before shells', () => {
      const processMap = new Map([
        [
          65364,
          {
            pid: 65364,
            ppid: 65363,
            pgid: 65339,
            command:
              'node --conditions=development /repo/oneTrickUI.feat-a/node_modules/.bin/react-router dev',
          },
        ],
        [
          65363,
          {
            pid: 65363,
            ppid: 65339,
            pgid: 65339,
            command:
              'node /repo/oneTrickUI.feat-a/node_modules/.bin/react-router dev',
          },
        ],
        [
          65339,
          {
            pid: 65339,
            ppid: 71625,
            pgid: 65339,
            command: 'npm run dev',
          },
        ],
        [
          71625,
          {
            pid: 71625,
            ppid: 1,
            pgid: 71625,
            command: '-zsh',
          },
        ],
      ]);

      const resolved = resolveProcessWrapperChain(
        processMap.get(65364),
        processMap,
        { selfPid: 99999, selfPgid: 99999 },
      );

      expect(resolved.chain.map((proc) => proc.pid)).toEqual([
        65339, 65363, 65364,
      ]);
      expect(resolved.root.pid).toBe(65339);
      expect(resolved.detached).toBe(false);
    });

    it('signals process group when wrapper root leads its own pgid and falls back to PIDs when shared with caller pgid', () => {
      const psTable = new Map([
        [
          65363,
          '65363 65339 65339 node /repo/oneTrickUI.feat-a/node_modules/.bin/react-router dev',
        ],
        [65339, '65339 1 65339 npm run dev'],
        [70010, '70010 70000 70000 npm run dev'],
        [70000, '70000 1 70000 -zsh'],
      ]);
      const execCommand = vi.fn((file, args) => {
        if (file === 'ps') {
          const pids = args[args.indexOf('-p') + 1].split(',').map(Number);
          return pids
            .map((pid) => psTable.get(pid))
            .filter(Boolean)
            .join('\n');
        }
        throw new Error(`Unexpected command: ${file}`);
      });

      const killProcess = vi.fn();

      const result = stopServerProcesses(
        [
          {
            pid: 65364,
            ppid: 65363,
            pgid: 65339,
            port: 15437,
            path: '/repo/oneTrickUI.feat-a',
            command:
              'node --conditions=development /repo/oneTrickUI.feat-a/node_modules/.bin/react-router dev',
          },
          {
            pid: 70011,
            ppid: 70010,
            pgid: 70000,
            port: 15438,
            path: '/repo/oneTrickUI.feat-b',
            command: 'node /repo/oneTrickUI.feat-b/node_modules/.bin/vite',
          },
        ],
        {
          execCommand,
          killProcess,
          selfPid: 99999,
          selfPgid: 70000,
        },
      );

      expect(killProcess.mock.calls).toEqual([
        [-65339, 'SIGTERM'],
        [70010, 'SIGTERM'],
        [70011, 'SIGTERM'],
      ]);
      expect(result.failed).toEqual([]);
      expect(result.stopped).toHaveLength(2);
      expect(result.stopped[0]).toMatchObject({
        pid: 65364,
        signaledPgid: 65339,
        signaledPids: [65339, 65363, 65364],
        alreadyExited: false,
      });
      expect(result.stopped[1]).toMatchObject({
        pid: 70011,
        signaledPgid: null,
        signaledPids: [70010, 70011],
        alreadyExited: false,
      });
    });

    it('handles ESRCH gracefully and reports EPERM or unsafe PIDs as failures', () => {
      const killProcess = vi.fn((pid) => {
        if (pid === 8001) {
          const err = new Error('No such process');
          err.code = 'ESRCH';
          throw err;
        }
        if (pid === 8002) {
          const err = new Error('Operation not permitted');
          err.code = 'EPERM';
          throw err;
        }
      });

      const result = stopServerProcesses(
        [
          {
            pid: 8001,
            ppid: 1,
            pgid: 7999,
            port: 16001,
            path: '/repo/oneTrickUI.feat-gone',
            command: 'node ./node_modules/.bin/vite',
          },
          {
            pid: 8002,
            ppid: 1,
            pgid: 7999,
            port: 16002,
            path: '/repo/oneTrickUI.feat-denied',
            command: 'node ./node_modules/.bin/vite',
          },
          {
            pid: 1,
            ppid: 0,
            pgid: 1,
            port: 16003,
            path: '/repo/oneTrickUI.feat-bad',
            command: 'node ./node_modules/.bin/vite',
          },
        ],
        {
          execCommand: vi.fn(),
          killProcess,
          selfPid: 99999,
          selfPgid: 99999,
        },
      );

      expect(result.stopped).toHaveLength(1);
      expect(result.stopped[0]).toMatchObject({
        pid: 8001,
        alreadyExited: true,
      });
      expect(result.failed).toHaveLength(2);
      expect(result.failed[0]).toMatchObject({
        pid: 8002,
        error: 'Operation not permitted',
      });
      expect(result.failed[1]).toMatchObject({
        pid: 1,
        error: 'Refusing to signal unsafe PID 1',
      });
    });

    it('finds and stops only servers for the requested worktree path', () => {
      const wtJson = JSON.stringify({
        items: [
          {
            branch: 'main',
            worktree: { path: '/repo/oneTrickUI', main: true, current: true },
            dev_server: { url: 'http://localhost:12107', listening: true },
          },
          {
            branch: 'feat/target',
            worktree: {
              path: '/repo/oneTrickUI.feat-target',
              main: false,
              current: false,
            },
            dev_server: { url: 'http://localhost:15555', listening: true },
          },
        ],
      });

      const execCommand = vi.fn((file, args) => {
        if (file === 'wt') return wtJson;
        if (file === 'lsof' && args.includes('-iTCP')) {
          return [
            'p4100',
            'cnode',
            'f19',
            'n[::1]:12107',
            'p4200',
            'cnode',
            'f20',
            'n*:4206',
            'f21',
            'n[::1]:15555',
            'p4300',
            'cnode',
            'f22',
            'n[::1]:16666',
          ].join('\n');
        }
        if (file === 'lsof' && args.includes('cwd')) {
          return [
            'p4100',
            'fcwd',
            'n/repo/oneTrickUI',
            'p4200',
            'fcwd',
            'n/repo/oneTrickUI.feat-target',
            'p4300',
            'fcwd',
            'n/repo/oneTrickUI/.worktrees/feat-nested',
          ].join('\n');
        }
        if (file === 'ps') {
          return [
            '4100 1 4100 node /repo/oneTrickUI/node_modules/.bin/react-router dev',
            '4200 1 4200 node /repo/oneTrickUI.feat-target/node_modules/.bin/react-router dev',
            '4300 1 4300 node /repo/oneTrickUI/.worktrees/feat-nested/node_modules/.bin/react-router dev',
          ].join('\n');
        }
        throw new Error(`Unexpected command: ${file}`);
      });

      const mainMatches = findWorktreeServersForPath('/repo/oneTrickUI', {
        execCommand,
        normalizePath: (p) => p,
      });
      expect(mainMatches.map((entry) => entry.pid)).toEqual([4100]);

      const killProcess = vi.fn();
      const stoppedTarget = stopWorktreeServersByPath(
        '/repo/oneTrickUI.feat-target',
        {
          execCommand,
          killProcess,
          normalizePath: (p) => p,
          selfPid: 99999,
          selfPgid: 99999,
        },
      );

      expect(killProcess).toHaveBeenCalledTimes(1);
      expect(killProcess).toHaveBeenCalledWith(-4200, 'SIGTERM');
      expect(stoppedTarget.stopped).toHaveLength(1);
      expect(stoppedTarget.stopped[0]).toMatchObject({
        pid: 4200,
        port: 15555,
      });

      const killIdle = vi.fn();
      const idleResult = stopWorktreeServersByPath(
        '/repo/oneTrickUI.feat-none',
        {
          execCommand,
          killProcess: killIdle,
          normalizePath: (p) => p,
        },
      );
      expect(killIdle).not.toHaveBeenCalled();
      expect(idleResult).toEqual({
        targetPath: '/repo/oneTrickUI.feat-none',
        stopped: [],
        failed: [],
      });
    });

    it('kills detected orphans via killOrphanedWorktreeServers', () => {
      const wtJson = JSON.stringify({
        items: [
          {
            branch: 'main',
            worktree: { path: '/repo/oneTrickUI', main: true, current: true },
          },
        ],
      });

      const execCommand = vi.fn((file, args) => {
        if (file === 'wt') return wtJson;
        if (file === 'lsof' && args.includes('-iTCP')) {
          return ['p9100', 'cnode', 'f19', 'n127.0.0.1:17777'].join('\n');
        }
        if (file === 'lsof' && args.includes('cwd')) {
          return ['p9100', 'fcwd', 'n/repo/oneTrickUI.feat-old'].join('\n');
        }
        if (file === 'ps') {
          return '9100 1 9100 node /repo/oneTrickUI.feat-old/node_modules/.bin/react-router dev';
        }
        throw new Error(`Unexpected command: ${file}`);
      });

      const killProcess = vi.fn();
      const result = killOrphanedWorktreeServers({
        execCommand,
        killProcess,
        normalizePath: (p) => p,
        selfPid: 99999,
        selfPgid: 99999,
      });

      expect(killProcess).toHaveBeenCalledWith(-9100, 'SIGTERM');
      expect(result.failed).toEqual([]);
      expect(result.stopped).toHaveLength(1);
      expect(result.stopped[0]).toMatchObject({
        pid: 9100,
        port: 17777,
        reason: 'removed-worktree',
      });
    });
  });

  describe('formatting and CLI', () => {
    it('shortens home directory paths cleanly', () => {
      expect(
        formatPathForDisplay('/Users/dev/projects/oneTrickUI', '/Users/dev'),
      ).toBe('~/projects/oneTrickUI');
      expect(formatPathForDisplay('/opt/app', '/Users/dev')).toBe('/opt/app');
    });

    it('formats empty and populated tables for active ports, orphans, and stop results', () => {
      expect(formatWorktreePortsTable([], { includeAll: false })).toContain(
        'No active UI worktree ports found.',
      );

      const table = formatWorktreePortsTable(
        [
          {
            branch: 'main',
            port: 12107,
            url: 'http://localhost:12107',
            active: true,
            pid: 1234,
            path: '/Users/dev/oneTrickUI',
          },
        ],
        { includeAll: false, homeDir: '/Users/dev' },
      );

      expect(table).toContain('BRANCH');
      expect(table).toContain('main');
      expect(table).toContain('12107');
      expect(table).toContain('http://localhost:12107');
      expect(table).toContain('~/oneTrickUI');

      expect(formatOrphanedServersTable([])).toBe(
        'No orphaned UI servers found for this repository.',
      );
      const orphanTable = formatOrphanedServersTable(
        [
          {
            reason: 'removed-worktree',
            port: 15437,
            url: 'http://localhost:15437',
            pid: 65364,
            ppid: 1,
            detached: true,
            path: '/Users/dev/oneTrickUI.feat-old',
          },
        ],
        { homeDir: '/Users/dev' },
      );
      expect(orphanTable).toContain('REASON');
      expect(orphanTable).toContain('removed-worktree');
      expect(orphanTable).toContain('DETACHED');
      expect(orphanTable).toContain('yes');
      expect(orphanTable).toContain('~/oneTrickUI.feat-old');

      expect(
        formatStopResult(
          { stopped: [], failed: [] },
          {
            mode: 'stop-path',
            targetPath: '/Users/dev/oneTrickUI.feat-old',
            homeDir: '/Users/dev',
          },
        ),
      ).toBe('No running UI server found for ~/oneTrickUI.feat-old.');

      expect(
        formatStopResult(
          {
            stopped: [
              {
                pid: 65364,
                port: 15437,
                reason: 'removed-worktree',
                path: '/Users/dev/oneTrickUI.feat-old',
                signal: 'SIGTERM',
                signaledPgid: 65339,
                signaledPids: [65339, 65364],
                alreadyExited: false,
              },
            ],
            failed: [],
          },
          { mode: 'orphans', homeDir: '/Users/dev' },
        ),
      ).toContain('SIGTERM -> pgid 65339');
    });

    it('parses CLI flags and validates missing values, conflicts, and unknown options', () => {
      expect(parseCliArgs(['--all', '--json'])).toEqual({
        all: true,
        json: true,
        orphans: false,
        killOrphans: false,
        stopPath: null,
        help: false,
      });
      expect(parseCliArgs(['-h'])).toEqual({
        all: false,
        json: false,
        orphans: false,
        killOrphans: false,
        stopPath: null,
        help: true,
      });
      expect(parseCliArgs(['--orphans', '--json'])).toEqual({
        all: false,
        json: true,
        orphans: true,
        killOrphans: false,
        stopPath: null,
        help: false,
      });
      expect(parseCliArgs(['--kill-orphans'])).toEqual({
        all: false,
        json: false,
        orphans: false,
        killOrphans: true,
        stopPath: null,
        help: false,
      });
      expect(parseCliArgs(['--stop-path', '/repo/oneTrickUI.feat-x'])).toEqual({
        all: false,
        json: false,
        orphans: false,
        killOrphans: false,
        stopPath: '/repo/oneTrickUI.feat-x',
        help: false,
      });
      expect(parseCliArgs(['--stop-path=/repo/oneTrickUI.feat-y'])).toEqual({
        all: false,
        json: false,
        orphans: false,
        killOrphans: false,
        stopPath: '/repo/oneTrickUI.feat-y',
        help: false,
      });

      expect(parseCliArgs(['--stop-path']).error).toBe(
        'Missing value for --stop-path',
      );
      expect(parseCliArgs(['--stop-path', '--json']).error).toBe(
        'Missing value for --stop-path',
      );
      expect(parseCliArgs(['--stop-path=']).error).toBe(
        'Missing value for --stop-path',
      );
      expect(
        parseCliArgs(['--stop-path', '/repo/wt', '--kill-orphans']).error,
      ).toContain('Cannot combine --stop-path');
      expect(parseCliArgs(['--all', '--orphans']).error).toContain(
        'Cannot combine --all',
      );
      expect(parseCliArgs(['--bogus']).error).toBe('Unknown option: --bogus');

      const helpText = getHelpText();
      expect(helpText).toContain('--orphans');
      expect(helpText).toContain('--kill-orphans');
      expect(helpText).toContain('--stop-path <path>');
    });

    it('prints JSON output and returns exit code 0 via runCli', () => {
      const stdout = vi.fn();
      const stderr = vi.fn();
      const wtJson = JSON.stringify({
        items: [
          {
            branch: 'main',
            worktree: { path: '/repo/oneTrickUI', main: true, current: true },
            dev_server: { url: 'http://localhost:12107', listening: true },
          },
        ],
      });

      const exitCode = runCli(['--json'], {
        stdout,
        stderr,
        collectOptions: {
          normalizePath: (p) => p,
          execCommand: (file) => {
            if (file === 'wt') return wtJson;
            throw new Error('no lsof');
          },
        },
      });

      expect(exitCode).toBe(0);
      expect(stderr).not.toHaveBeenCalled();
      expect(JSON.parse(stdout.mock.calls[0][0])).toHaveLength(1);
    });

    it('supports --orphans, --orphans --json, --kill-orphans, --stop-path, and error handling via runCli', () => {
      const wtJson = JSON.stringify({
        items: [
          {
            branch: 'main',
            worktree: { path: '/repo/oneTrickUI', main: true, current: true },
          },
        ],
      });

      const execCommand = (file, args) => {
        if (file === 'wt') return wtJson;
        if (file === 'lsof' && args.includes('-iTCP')) {
          return ['p9200', 'cnode', 'f19', 'n127.0.0.1:18888'].join('\n');
        }
        if (file === 'lsof' && args.includes('cwd')) {
          return ['p9200', 'fcwd', 'n/repo/oneTrickUI.feat-old'].join('\n');
        }
        if (file === 'ps') {
          return '9200 1 9200 node /repo/oneTrickUI.feat-old/node_modules/.bin/react-router dev';
        }
        throw new Error(`Unexpected command: ${file}`);
      };

      const orphanJsonStdout = vi.fn();
      const orphanJsonStderr = vi.fn();
      expect(
        runCli(['--orphans', '--json'], {
          stdout: orphanJsonStdout,
          stderr: orphanJsonStderr,
          collectOptions: { execCommand, normalizePath: (p) => p },
        }),
      ).toBe(0);
      expect(orphanJsonStderr).not.toHaveBeenCalled();
      expect(JSON.parse(orphanJsonStdout.mock.calls[0][0])).toEqual([
        expect.objectContaining({
          pid: 9200,
          port: 18888,
          reason: 'removed-worktree',
          detached: true,
        }),
      ]);

      const killStdout = vi.fn();
      const killStderr = vi.fn();
      const killProcess = vi.fn();
      expect(
        runCli(['--kill-orphans'], {
          stdout: killStdout,
          stderr: killStderr,
          collectOptions: {
            execCommand,
            killProcess,
            normalizePath: (p) => p,
            selfPid: 99999,
            selfPgid: 99999,
          },
        }),
      ).toBe(0);
      expect(killProcess).toHaveBeenCalledWith(-9200, 'SIGTERM');
      expect(killStdout.mock.calls[0][0]).toContain('PID 9200');
      expect(killStdout.mock.calls[0][0]).toContain('port 18888');

      const stopIdleStdout = vi.fn();
      expect(
        runCli(['--stop-path', '/repo/oneTrickUI.feat-idle'], {
          stdout: stopIdleStdout,
          stderr: vi.fn(),
          collectOptions: {
            execCommand,
            killProcess: vi.fn(),
            normalizePath: (p) => p,
          },
        }),
      ).toBe(0);
      expect(stopIdleStdout.mock.calls[0][0]).toContain(
        'No running UI server found',
      );

      const stopMatchKill = vi.fn();
      const stopMatchStdout = vi.fn();
      expect(
        runCli(['--stop-path', '/repo/oneTrickUI.feat-old', '--json'], {
          stdout: stopMatchStdout,
          stderr: vi.fn(),
          collectOptions: {
            execCommand,
            killProcess: stopMatchKill,
            normalizePath: (p) => p,
            selfPid: 99999,
            selfPgid: 99999,
          },
        }),
      ).toBe(0);
      expect(stopMatchKill).toHaveBeenCalledWith(-9200, 'SIGTERM');
      expect(JSON.parse(stopMatchStdout.mock.calls[0][0]).stopped).toHaveLength(
        1,
      );

      const errStdout = vi.fn();
      const errStderr = vi.fn();
      expect(
        runCli(['--stop-path'], {
          stdout: errStdout,
          stderr: errStderr,
        }),
      ).toBe(1);
      expect(errStderr.mock.calls[0][0]).toBe('Missing value for --stop-path');
      expect(errStderr.mock.calls[1][0]).toContain('Usage: worktree-ports');

      const helpStdout = vi.fn();
      expect(runCli(['--help'], { stdout: helpStdout, stderr: vi.fn() })).toBe(
        0,
      );
      expect(helpStdout.mock.calls[0][0]).toContain('--kill-orphans');
    });
  });
});
