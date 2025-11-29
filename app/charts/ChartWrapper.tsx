import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { cn } from '~/lib/utils';

interface Props {
  children?: React.ReactNode;
  className?: string;
  title?: React.ReactNode;
  description?: string;
  footer?: React.ReactNode;
}

export const ChartWrapper: React.FC<Props> = ({
  title,
  description,
  className,
  children,
  footer,
}) => {
  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        {title && <CardTitle>{title}</CardTitle>}
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
      {footer && <CardFooter>{footer}</CardFooter>}
    </Card>
  );
};
