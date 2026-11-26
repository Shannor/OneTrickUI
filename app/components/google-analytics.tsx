export const GOOGLE_ANALYTICS_ID = 'G-EQN0Y59J6B';

const GTAG_INIT_SCRIPT = [
  'window.dataLayer = window.dataLayer || [];',
  'function gtag(){dataLayer.push(arguments);}',
  "gtag('js', new Date());",
].join('\n');

export interface GoogleAnalyticsProps {
  measurementId?: string;
  enabled?: boolean;
}

export function GoogleAnalytics({
  measurementId = GOOGLE_ANALYTICS_ID,
  enabled = import.meta.env.PROD,
}: GoogleAnalyticsProps) {
  if (!enabled || !measurementId) {
    return null;
  }

  return (
    <>
      <script
        async
        src={`https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(measurementId)}`}
      />
      <script dangerouslySetInnerHTML={{ __html: GTAG_INIT_SCRIPT }} />
    </>
  );
}
