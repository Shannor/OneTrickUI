import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { cn } from '~/lib/utils';

interface Props {
  children?: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
}

export const ChartHeader: React.FC<Props> = ({
  title,
  description,
  className,
  children,
}) => {
  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
};
