import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { log } from 'evlog';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ShareSiteButton } from './share-site-button';

describe('ShareSiteButton', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: undefined,
    });
  });

  it('copies the share URL to clipboard and shows Copied! feedback', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: writeTextMock },
    });

    render(
      <ShareSiteButton
        shareUrl="https://d2onetrick.com"
        playerName="Guardian#1234"
      />,
    );

    const button = screen.getByRole('button', { name: /share 1 trick/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalledWith('https://d2onetrick.com');
    });

    expect(
      await screen.findByRole('button', { name: /copied!/i }),
    ).toBeInTheDocument();
  });

  it('uses navigator.share when supported and includes player name in text', async () => {
    const shareMock = vi.fn().mockResolvedValue(undefined);
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: shareMock,
    });
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: writeTextMock },
    });

    render(
      <ShareSiteButton
        shareUrl="https://d2onetrick.com"
        playerName="Weegee#1234"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /share 1 trick/i }));

    await waitFor(() => {
      expect(shareMock).toHaveBeenCalledWith({
        title: '1 Trick',
        text: expect.stringContaining('Weegee#1234'),
        url: 'https://d2onetrick.com',
      });
    });
    expect(writeTextMock).not.toHaveBeenCalled();
  });

  it('ignores AbortError from navigator.share without falling back to clipboard', async () => {
    const abortError = new Error('User cancelled');
    abortError.name = 'AbortError';
    const shareMock = vi.fn().mockRejectedValue(abortError);
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: shareMock,
    });
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: writeTextMock },
    });

    render(<ShareSiteButton shareUrl="https://d2onetrick.com" />);

    fireEvent.click(screen.getByRole('button', { name: /share 1 trick/i }));

    await waitFor(() => {
      expect(shareMock).toHaveBeenCalled();
    });
    expect(writeTextMock).not.toHaveBeenCalled();
  });

  it('logs an error when clipboard copy fails', async () => {
    const writeTextMock = vi
      .fn()
      .mockRejectedValue(new Error('Clipboard unavailable'));
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: writeTextMock },
    });
    const logErrorSpy = vi.spyOn(log, 'error').mockImplementation(() => {});

    render(<ShareSiteButton shareUrl="https://d2onetrick.com" />);

    fireEvent.click(screen.getByRole('button', { name: /share 1 trick/i }));

    await waitFor(() => {
      expect(logErrorSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'search.share_site',
          message: 'Failed to copy 1 Trick share URL',
        }),
      );
    });
  });
});
