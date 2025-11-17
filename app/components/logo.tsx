import { cn } from '~/lib/utils';

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
  alt?: string;
}

export function Logo({
  className,
  width = 128,
  height = 128,
  alt = 'OneTrick logo',
}: LogoProps) {
  return (
    <>
      <img
        src="/logo.svg"
        alt={alt}
        width={width}
        height={height}
        className={cn('block dark:hidden', className)}
      />
      <img
        src="/logo-white.svg"
        alt={alt}
        width={width}
        height={height}
        className={cn('hidden dark:block', className)}
      />
    </>
  );
}
