import { describe, expect, it, vi } from 'vitest';

import {
  collectWorktreePorts,
  formatPathForDisplay,
  formatWorktreePortsTable,
  hashBranchToPort,
  isLoopbackAddress,
  isUiServerCommand,
  matchWorktreeForPath,
  parseCliArgs,
  parseGitWorktreeList,
  parseLsofCwd,
  parseLsofListeners,
  parsePortFromUrl,
  parsePsCommands,
  parseWtListOutput,
  runCli,
  selectPrimaryPortForProcess,
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
  });

  describe('parseGitWorktreeList', () => {
    it('parses porcelain output including detached worktrees', () => {
      const raw = [
        'worktree /repo/oneTrickUI',
        'HEAD abc123',
        'branch refs/heads/main',
        '',
        'worktree /repo/oneTrickUI.detached',
        'HEAD def456',
        'detached',
      ].join('\n');

      const result = parseGitWorktreeList(raw, '/repo/oneTrickUI/app');

      expect(result).toHaveLength(2);
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
  });

  describe('isUiServerCommand', () => {
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
  });

  describe('matchWorktreeForPath', () => {
    it('matches the most specific nested worktree without false sibling matches', () => {
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
        matchWorktreeForPath('/repo/oneTrickUI-other', worktrees, identity),
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
  });

  describe('formatting and CLI', () => {
    it('shortens home directory paths cleanly', () => {
      expect(
        formatPathForDisplay('/Users/dev/projects/oneTrickUI', '/Users/dev'),
      ).toBe('~/projects/oneTrickUI');
      expect(formatPathForDisplay('/opt/app', '/Users/dev')).toBe('/opt/app');
    });

    it('formats empty and populated tables', () => {
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
    });

    it('parses CLI flags and handles unknown options', () => {
      expect(parseCliArgs(['--all', '--json'])).toEqual({
        all: true,
        json: true,
        help: false,
      });
      expect(parseCliArgs(['-h'])).toEqual({
        all: false,
        json: false,
        help: true,
      });
      expect(parseCliArgs(['--bogus']).error).toBe('Unknown option: --bogus');
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
  });
});
