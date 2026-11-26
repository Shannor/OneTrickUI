import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  pruneStaleDraftCharacters,
  updateDraftCharacters,
  useFireteamSelection,
} from './use-fireteam-selection';

describe('updateDraftCharacters', () => {
  it('stores draft with baseSavedCharId when selecting a different character', () => {
    const next = updateDraftCharacters({}, 'u1', 'c1', 'c2');

    expect(next).toEqual({
      u1: { characterId: 'c2', baseSavedCharId: 'c1' },
    });
  });

  it('removes draft when selecting the saved character or clearing selection', () => {
    const initial = { u1: { characterId: 'c2', baseSavedCharId: 'c1' } };

    expect(updateDraftCharacters(initial, 'u1', 'c1', 'c1')).toEqual({});
    expect(updateDraftCharacters(initial, 'u1', 'c1', null)).toEqual({});
    expect(updateDraftCharacters(initial, 'u1', 'c1', undefined)).toEqual({});
  });

  it('returns the same reference when clearing a member without an existing draft', () => {
    const initial = {};
    expect(updateDraftCharacters(initial, 'u1', 'c1', 'c1')).toBe(initial);
  });
});

describe('pruneStaleDraftCharacters', () => {
  it('keeps drafts whose baseSavedCharId matches the current saved character', () => {
    const drafts = {
      u1: { characterId: 'c2', baseSavedCharId: 'c1' },
    };

    expect(pruneStaleDraftCharacters(drafts, { u1: 'c1' })).toEqual({
      u1: 'c2',
    });
  });

  it('drops drafts when loader revalidation updates the saved character', () => {
    const drafts = {
      u1: { characterId: 'c2', baseSavedCharId: 'c1' },
      u2: { characterId: 'c4', baseSavedCharId: 'c3' },
    };

    expect(pruneStaleDraftCharacters(drafts, { u1: 'c2', u2: 'c3' })).toEqual({
      u2: 'c4',
    });
    expect(pruneStaleDraftCharacters(drafts, { u1: 'c9', u2: 'c3' })).toEqual({
      u2: 'c4',
    });
  });
});

describe('useFireteamSelection', () => {
  it('tracks draft character changes without requiring callers to pass savedCharId', () => {
    const { result } = renderHook(({ saved }) => useFireteamSelection(saved), {
      initialProps: { saved: { u1: 'c1' } },
    });

    act(() => {
      result.current.selectMemberCharacter('u1', 'c2');
    });
    expect(result.current.draftCharacters).toEqual({ u1: 'c2' });

    act(() => {
      result.current.selectMemberCharacter('u1', 'c1');
    });
    expect(result.current.draftCharacters).toEqual({});
  });

  it('prunes stale drafts when fireteamMemWithCharacters updates on revalidation', () => {
    const { result, rerender } = renderHook(
      ({ saved }) => useFireteamSelection(saved),
      {
        initialProps: { saved: { u1: 'c1', u2: 'c3' } },
      },
    );

    act(() => {
      result.current.selectMemberCharacter('u1', 'c2');
      result.current.selectMemberCharacter('u2', 'c4');
    });
    expect(result.current.draftCharacters).toEqual({ u1: 'c2', u2: 'c4' });

    rerender({ saved: { u1: 'c2', u2: 'c3' } });
    expect(result.current.draftCharacters).toEqual({ u2: 'c4' });
  });

  it('toggles excluded members for bulk start', () => {
    const { result } = renderHook(() => useFireteamSelection({ u1: 'c1' }));

    act(() => {
      result.current.toggleMemberBulkSelect('u1', false);
    });
    expect(result.current.excludedMemberIds).toEqual({ u1: true });

    act(() => {
      result.current.toggleMemberBulkSelect('u1', true);
    });
    expect(result.current.excludedMemberIds).toEqual({ u1: false });
  });
});
