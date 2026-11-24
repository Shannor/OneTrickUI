import {
  type KeyboardEvent,
  type MouseEvent,
  useRef,
  useState,
} from 'react';

export function useTapTooltip() {
  const [open, setOpen] = useState(false);
  const wasOpenBeforePointerDownRef = useRef<boolean | null>(null);

  const onPointerDown = () => {
    wasOpenBeforePointerDownRef.current = open;
  };

  const onPointerCancel = () => {
    wasOpenBeforePointerDownRef.current = null;
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      wasOpenBeforePointerDownRef.current = null;
    }
  };

  const onClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const wasOpen = wasOpenBeforePointerDownRef.current;
    wasOpenBeforePointerDownRef.current = null;
    if (wasOpen !== null) {
      setOpen(!wasOpen);
      return;
    }
    setOpen((prev) => !prev);
  };

  const onContentClick = (e: MouseEvent) => {
    e.stopPropagation();
  };

  return {
    open,
    onOpenChange: setOpen,
    triggerProps: {
      onPointerDown,
      onPointerCancel,
      onKeyDown,
      onClick,
    },
    contentProps: {
      onClick: onContentClick,
    },
  };
}
