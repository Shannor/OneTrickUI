import { AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { Link } from 'react-router';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import { buttonVariants } from '~/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { getBungieAuthUrl } from '~/lib/auth-utils';
import { cn } from '~/lib/utils';

export interface AuthRetryCardProps {
  error?: string;
  className?: string;
}

export function AuthRetryCard({ error, className }: AuthRetryCardProps) {
  const errorMessage =
    error || 'There was an error during sign in. Please try again.';
  const bungieUrl = getBungieAuthUrl();

  return (
    <Card className={className}>
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertCircle className="h-6 w-6" />
        </div>
        <CardTitle className="text-2xl font-bold">Sign In Failed</CardTitle>
        <CardDescription>
          We were unable to complete your authentication with Bungie.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="destructive" className="break-words">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <AlertTitle>Authentication Error</AlertTitle>
          <AlertDescription className="break-words text-xs">
            {errorMessage}
          </AlertDescription>
        </Alert>
      </CardContent>
      <CardFooter className="flex flex-col gap-2 sm:flex-row">
        <Link
          to={bungieUrl}
          reloadDocument
          className={cn(
            buttonVariants({ variant: 'default' }),
            'flex h-auto min-h-[2.5rem] w-full flex-1 items-center justify-center gap-2 whitespace-normal px-4 py-2 text-center',
          )}
        >
          <RefreshCw className="h-4 w-4 shrink-0" />
          <span>Retry Sign In</span>
        </Link>
        <Link
          to="/"
          className={cn(
            buttonVariants({ variant: 'outline' }),
            'flex h-auto min-h-[2.5rem] w-full flex-1 items-center justify-center gap-2 whitespace-normal px-4 py-2 text-center',
          )}
        >
          <ArrowLeft className="h-4 w-4 shrink-0" />
          <span>Back to Home</span>
        </Link>
      </CardFooter>
    </Card>
  );
}
