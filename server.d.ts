import type { Express } from 'express';
import type { ServerBuild } from 'react-router';

export function createServerApp(
  build: ServerBuild | (() => Promise<ServerBuild>),
  mode?: string,
): Express;
