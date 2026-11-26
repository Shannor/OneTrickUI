import { Tooltip as TooltipPrimitive } from 'radix-ui';
import * as React from 'react';
import { cn } from '~/lib/utils';

const TooltipProvider = TooltipPrimitive.Provider;
const TooltipArrow = TooltipPrimitive.Arrow;

interface TapTooltipContextValue {
  open: boolean;
  setOpen: (nextOpen: boolean) => void;
  disableTapTrigger: boolean;
}

const TapTooltipContext = React.createContext<TapTooltipContextValue | null>(
  null,
);

export interface TooltipProps extends React.ComponentPropsWithoutRef<
  typeof TooltipPrimitive.Root
> {
  disableTapTrigger?: boolean;
}

function Tooltip({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  disableTapTrigger = false,
  ...props
}: TooltipProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : uncontrolledOpen;

  const setOpen = React.useCallback(
    (nextOpen: boolean) => {
      if (nextOpen && !open && typeof document !== 'undefined') {
        document.dispatchEvent(new CustomEvent('tooltip.open'));
      }
      if (!isControlled) {
        setUncontrolledOpen(nextOpen);
      }
      onOpenChange?.(nextOpen);
    },
    [isControlled, onOpenChange, open],
  );

  const contextValue = React.useMemo(
    () => ({ open, setOpen, disableTapTrigger }),
    [open, setOpen, disableTapTrigger],
  );

  return (
    <TapTooltipContext.Provider value={contextValue}>
      <TooltipPrimitive.Root open={open} onOpenChange={setOpen} {...props} />
    </TapTooltipContext.Provider>
  );
}

const TooltipTrigger = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Trigger>
>(
  (
    {
      asChild,
      type,
      onPointerDown,
      onPointerCancel,
      onKeyDown,
      onClick,
      ...props
    },
    ref,
  ) => {
    const tapContext = React.useContext(TapTooltipContext);
    const wasOpenBeforePointerDownRef = React.useRef<boolean | null>(null);
    const tapEnabled = Boolean(tapContext && !tapContext.disableTapTrigger);

    const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
      if (tapEnabled && tapContext) {
        wasOpenBeforePointerDownRef.current = tapContext.open;
      }
      onPointerDown?.(e);
    };

    const handlePointerCancel = (e: React.PointerEvent<HTMLButtonElement>) => {
      if (tapEnabled) {
        wasOpenBeforePointerDownRef.current = null;
      }
      onPointerCancel?.(e);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (tapEnabled && (e.key === 'Enter' || e.key === ' ')) {
        wasOpenBeforePointerDownRef.current = null;
      }
      onKeyDown?.(e);
    };

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(e);
      if (!tapEnabled || !tapContext || e.defaultPrevented) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      const wasOpen = wasOpenBeforePointerDownRef.current;
      wasOpenBeforePointerDownRef.current = null;
      if (wasOpen !== null) {
        tapContext.setOpen(!wasOpen);
        return;
      }
      tapContext.setOpen(!tapContext.open);
    };

    return (
      <TooltipPrimitive.Trigger
        ref={ref}
        asChild={asChild}
        type={asChild ? type : (type ?? 'button')}
        onPointerDown={handlePointerDown}
        onPointerCancel={handlePointerCancel}
        onKeyDown={handleKeyDown}
        onClick={handleClick}
        {...props}
      />
    );
  },
);
TooltipTrigger.displayName = TooltipPrimitive.Trigger.displayName;

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(
  (
    { className, sideOffset = 6, collisionPadding = 16, onClick, ...props },
    ref,
  ) => {
    const tapContext = React.useContext(TapTooltipContext);
    const tapEnabled = Boolean(tapContext && !tapContext.disableTapTrigger);

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      onClick?.(e);
      if (tapEnabled) {
        e.stopPropagation();
      }
    };

    return (
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          ref={ref}
          sideOffset={sideOffset}
          collisionPadding={collisionPadding}
          onClick={handleClick}
          className={cn(
            'z-50 max-w-[calc(100vw-2rem)] overflow-hidden break-words rounded-md border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
            className,
            'max-sm:max-w-[calc(100vw-2rem)]',
          )}
          {...props}
        />
      </TooltipPrimitive.Portal>
    );
  },
);
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export {
  Tooltip,
  TooltipArrow,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
};
