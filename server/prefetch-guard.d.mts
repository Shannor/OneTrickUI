export declare const PREFETCH_VARY_HEADER: string;
export declare const PREFETCH_SHORT_CIRCUIT_HEADERS: Readonly<{
  Vary: string;
  'Cache-Control': string;
}>;

export interface PrefetchGuardRequestInput {
  method?: string;
  pathname?: string;
  path?: string;
  url?: string;
  headers?: Headers | Record<string, string | string[] | undefined>;
}

export interface PrefetchGuardResponse {
  setHeader(name: string, value: string): unknown;
  status(code: number): { end(): unknown };
}

export declare function isPrefetchPurpose(
  headerValue: string | null | undefined,
): boolean;

export declare function isSameOriginAppReferer(
  refererHeader: string | null | undefined,
  requestHostHeader: string | null | undefined,
): boolean;

export declare function shouldShortCircuitDocumentPrefetch(
  input: Request | PrefetchGuardRequestInput,
): boolean;

export declare function createPrefetchGuardMiddleware(): (
  req: PrefetchGuardRequestInput,
  res: PrefetchGuardResponse,
  next: () => void,
) => void;
