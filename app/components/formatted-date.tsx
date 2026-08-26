import { format } from 'date-fns';
import { useHydrated } from '~/hooks/use-hydrated';

export interface FormattedDateProps {
  date: Date | string | number;
  formatStr?: string;
  fallbackFormatStr?: string;
  className?: string;
}

export function FormattedDate({
  date,
  formatStr = 'MM/dd/yyyy - p',
  fallbackFormatStr = 'MMM d, yyyy',
  className,
}: FormattedDateProps) {
  const isHydrated = useHydrated();
  const d = date instanceof Date ? date : new Date(date);

  const formattedText = isHydrated
    ? format(d, formatStr)
    : format(d, fallbackFormatStr);

  return <span className={className}>{formattedText}</span>;
}
