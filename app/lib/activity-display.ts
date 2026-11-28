export interface FormattedActivityLabel {
  label: string;
  modeLabel?: string;
}

export function formatActivityLabel(
  activity: string,
  mode?: string,
): FormattedActivityLabel {
  const lower = activity.toLowerCase();
  if (lower.includes('iron banner')) {
    return { label: activity };
  }

  let label = activity;
  let modeLabel = mode;

  if (lower.includes('control')) {
    label = 'Quickplay';
    if (mode) {
      modeLabel = mode.replace('Quickplay', '');
    }
  } else if (lower.includes('competitive')) {
    label = 'Competitive';
    if (mode) {
      modeLabel = mode.replace('Competitive', '').replace('Quickplay', '');
    }
  } else if (lower.includes('trials of osiris')) {
    label = 'Trials of Osiris';
    if (mode) {
      modeLabel = mode.replace('Trials of Osiris', '');
    }
  }

  const trimmedMode = modeLabel?.trim();
  return {
    label,
    modeLabel: trimmedMode || undefined,
  };
}
