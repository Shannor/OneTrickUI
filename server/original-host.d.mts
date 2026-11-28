export interface OriginalHostRequestInput {
  headers: Record<string, string | string[] | undefined>;
}

export declare function resolveTrustedOriginalHost(
  headerValue: string | string[] | null | undefined,
): string | null;

export declare function createOriginalHostMiddleware(): (
  req: OriginalHostRequestInput,
  res: unknown,
  next: () => void,
) => void;
