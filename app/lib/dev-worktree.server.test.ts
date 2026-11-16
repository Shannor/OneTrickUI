import { describe, expect, it, vi } from 'vitest';

import {
  hashBranchToPort,
  resolveDevWorktreeConfig,
} from './dev-worktree.server';

describe('dev-worktree.server', () => {
  describe('hashBranchToPort', () => {
    it('returns a deterministic port between 10000 and 19999 for a given branch', () => {
      const portA = hashBranchToPort('feat/similar-loadouts');
      const portB = hashBranchToPort('feat/similar-loadouts');
      const portOther = hashBranchToPort('fix/session-overview-loadout');

      expect(portA).toBe(portB);
      expect(portA).toBeGreaterThanOrEqual(10000);
      expect(portA).toBeLessThan(20000);
      expect(portOther).not.toBe(portA);
    });
  });

  describe('resolveDevWorktreeConfig', () => {
    it('uses Worktrunk hash_port and git branch by default with isolated local HMR', () => {
      const execCommand = vi.fn((cmd: string) => {
        if (cmd.includes('git rev-parse')) {
          return 'feat/similar-loadouts\n';
        }
        if (cmd.includes('wt step eval')) {
          return '16957\n';
        }
        throw new Error(`Unexpected command: ${cmd}`);
      });

      const config = resolveDevWorktreeConfig({
        env: {},
        execCommand,
      });

      expect(config).toEqual({
        branch: 'feat/similar-loadouts',
        port: 16957,
        hmr: undefined,
      });
    });

    it('prioritizes explicit PORT environment variable over Worktrunk port', () => {
      const execCommand = vi.fn((cmd: string) => {
        if (cmd.includes('git rev-parse')) {
          return 'feat/custom-port\n';
        }
        return '16957\n';
      });

      const config = resolveDevWorktreeConfig({
        env: { PORT: '4321' },
        execCommand,
      });

      expect(config.port).toBe(4321);
      expect(config.branch).toBe('feat/custom-port');
      expect(config.hmr).toBeUndefined();
    });

    it('enables ngrok HMR configuration on port 5173 when NGROK=true', () => {
      const execCommand = vi.fn(() => 'feat/oauth-test\n');

      const config = resolveDevWorktreeConfig({
        env: { NGROK: 'true' },
        execCommand,
      });

      expect(config).toEqual({
        branch: 'feat/oauth-test',
        port: 5173,
        hmr: {
          host: 'local.d2onetrick.ngrok.app',
          port: 5173,
          clientPort: 443,
        },
      });
    });

    it('falls back to deterministic branch hash port when wt CLI is unavailable', () => {
      const execCommand = vi.fn((cmd: string) => {
        if (cmd.includes('git rev-parse')) {
          return 'fix/session-overview-loadout\n';
        }
        throw new Error('wt: command not found');
      });

      const config = resolveDevWorktreeConfig({
        env: {},
        execCommand,
      });

      expect(config.branch).toBe('fix/session-overview-loadout');
      expect(config.port).toBe(
        hashBranchToPort('fix/session-overview-loadout'),
      );
      expect(config.hmr).toBeUndefined();
    });

    it('falls back to port 5173 and null branch when in detached HEAD without wt', () => {
      const execCommand = vi.fn((cmd: string) => {
        if (cmd.includes('git rev-parse')) {
          return 'HEAD\n';
        }
        throw new Error('wt unavailable');
      });

      const config = resolveDevWorktreeConfig({
        env: {},
        execCommand,
      });

      expect(config).toEqual({
        branch: null,
        port: 5173,
        hmr: undefined,
      });
    });

    it('respects DEV_BRANCH override without calling git', () => {
      const execCommand = vi.fn(() => '18001\n');

      const config = resolveDevWorktreeConfig({
        env: { DEV_BRANCH: 'release/v2' },
        execCommand,
      });

      expect(config.branch).toBe('release/v2');
      expect(config.port).toBe(18001);
      expect(execCommand).not.toHaveBeenCalledWith(
        expect.stringContaining('git rev-parse'),
      );
    });
  });
});
