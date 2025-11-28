import { format, setHours, setMinutes } from 'date-fns';
import { Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import * as React from 'react';
import type { DateRange } from 'react-day-picker';
import { Button } from '~/components/ui/button';
import { Calendar } from '~/components/ui/calendar';
import { Input } from '~/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover';
import type { CustomTimeWindow, TimeWindow } from '~/lib/metrics';
import { cn } from '~/lib/utils';

interface TimeInputProps extends React.ComponentProps<'input'> {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const TimeInput = React.forwardRef<HTMLInputElement, TimeInputProps>(
  ({ value, onChange, ...props }, ref) => {
    return (
      <Input
        ref={ref}
        type="time"
        value={value}
        onChange={onChange}
        className="w-full"
        {...props}
      />
    );
  },
);
TimeInput.displayName = 'TimeInput';

const presets: { label: string; value: TimeWindow }[] = [
  { label: 'Last Hour', value: 'last-hour' },
  { label: 'Last 3 Hours', value: 'last-3-hours' },
  { label: 'Last 6 Hours', value: 'last-6-hours' },
  { label: 'Today', value: 'one-day' },
  { label: 'This Week', value: 'one-week' },
  { label: 'This Month', value: 'one-month' },
  { label: 'All Time', value: 'all-time' },
];

function DisplayValue({ value }: { value: TimeWindow | CustomTimeWindow }) {
  if (typeof value === 'string') {
    const preset = presets.find((p) => p.value === value);
    return <>{preset ? preset.label : 'Select Date Range'}</>;
  }
  if (value) {
    const formatString = 'LLL do hh:mm aaa';
    const end = value.end ? value.end : value.start;
    return (
      <>
        {format(value.start, formatString)} - {format(end, formatString)}
      </>
    );
  }
  return <>Select Date Range</>;
}

interface DateRangePickerProps extends React.HTMLAttributes<HTMLDivElement> {
  value: TimeWindow | CustomTimeWindow;
  onValueChange: (value: TimeWindow | CustomTimeWindow) => void;
}

export function DateRangePicker({
  className,
  value,
  onValueChange,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const handlePresetClick = (preset: TimeWindow) => {
    onValueChange(preset);
    setIsOpen(false);
  };

  const handleDateSelect = (range: DateRange | undefined) => {
    if (range?.from) {
      const start =
        typeof value !== 'string' && value?.start
          ? setHours(
              setMinutes(range.from, value.start.getMinutes()),
              value.start.getHours(),
            )
          : range.from;
      const end = range.to
        ? typeof value !== 'string' && value?.end
          ? setHours(
              setMinutes(range.to, value.end.getMinutes()),
              value.end.getHours(),
            )
          : range.to
        : start;
      onValueChange({ start, end });
    }
  };

  const handleTimeChange = (
    part: 'start' | 'end',
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const [hours, minutes] = e.target.value.split(':').map(Number);
    if (typeof value !== 'string' && value?.[part]) {
      const newDate = setMinutes(setHours(value[part], hours), minutes);
      onValueChange({ ...value, [part]: newDate });
    }
  };

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={'outline'}
            className={cn(
              'max-w-[300px] justify-start text-left font-normal',
              !value && 'text-muted-foreground',
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            <DisplayValue value={value} />
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex w-1/3 flex-row border-r p-4 md:flex-col">
              {presets.map((preset) => (
                <Button
                  key={preset.label}
                  variant="ghost"
                  onClick={() => handlePresetClick(preset.value)}
                  className="w-full justify-start"
                >
                  {preset.label}
                </Button>
              ))}
            </div>
            <div className="flex-grow p-4">
              <Calendar
                autoFocus
                mode="range"
                selected={
                  typeof value !== 'string' && value
                    ? { from: value.start, to: value.end }
                    : undefined
                }
                onSelect={handleDateSelect}
                numberOfMonths={2}
              />
              {typeof value !== 'string' && (
                <div className="mt-4 flex gap-4">
                  <div>
                    <label>Start Time</label>
                    <TimeInput
                      value={format(value.start, 'HH:mm')}
                      onChange={(e) => handleTimeChange('start', e)}
                    />
                  </div>
                  <div>
                    <label>End Time</label>
                    <TimeInput
                      value={format(value.end ?? value.start, 'HH:mm')}
                      onChange={(e) => handleTimeChange('end', e)}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
