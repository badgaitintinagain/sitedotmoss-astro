import type { APIRoute } from 'astro';
import { NextRequest } from '../../shims/next-server';

type LegacyHandler = (request: NextRequest, context?: { params: Record<string, string> }) => Promise<Response>;

type LegacyModule = {
  GET?: LegacyHandler;
  POST?: LegacyHandler;
  PUT?: LegacyHandler;
  PATCH?: LegacyHandler;
  DELETE?: LegacyHandler;
};

const legacyRoutes = import.meta.glob('../../../app/api/**/route.ts');

const normalizePath = (value: string) => value.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');

const routePathFromKey = (key: string) => {
  const marker = '/app/api/';
  const start = key.indexOf(marker);
  if (start === -1) return '';
  const trimmed = key.slice(start + marker.length);
  return trimmed.replace(/\/route\.ts$/, '');
};

const matchRoute = (requestPath: string) => {
  const requested = normalizePath(requestPath).split('/').filter(Boolean);

  const sortedKeys = Object.keys(legacyRoutes).sort((left, right) => {
    const leftSegments = routePathFromKey(left).split('/').filter(Boolean);
    const rightSegments = routePathFromKey(right).split('/').filter(Boolean);

    const leftDynamic = leftSegments.filter((segment) => /^\[(.+)\]$/.test(segment)).length;
    const rightDynamic = rightSegments.filter((segment) => /^\[(.+)\]$/.test(segment)).length;

    if (leftDynamic !== rightDynamic) {
      return leftDynamic - rightDynamic;
    }

    return rightSegments.length - leftSegments.length;
  });

  for (const key of sortedKeys) {
    const routePath = routePathFromKey(key);
    const routeSegments = routePath.split('/').filter(Boolean);
    if (routeSegments.length !== requested.length) continue;

    const params: Record<string, string> = {};
    let matched = true;

    for (let i = 0; i < routeSegments.length; i += 1) {
      const segment = routeSegments[i];
      const current = requested[i];
      const paramMatch = segment.match(/^\[(.+)\]$/);

      if (paramMatch) {
        params[paramMatch[1]] = decodeURIComponent(current);
      } else if (segment !== current) {
        matched = false;
        break;
      }
    }

    if (matched) {
      return { key, params };
    }
  }

  return null;
};

const handleLegacy: APIRoute = async ({ request, params }) => {
  const requestPath = params.path ?? '';
  const matched = matchRoute(requestPath);

  if (!matched) {
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'content-type': 'application/json' },
    });
  }

  const loader = legacyRoutes[matched.key];
  const module = (await loader()) as LegacyModule;
  const method = request.method.toUpperCase() as keyof LegacyModule;
  const handler = module[method];

  if (!handler) {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'content-type': 'application/json' },
    });
  }

  const nextRequest = new NextRequest(request);
  return handler(nextRequest, { params: matched.params });
};

export const GET = handleLegacy;
export const POST = handleLegacy;
export const PUT = handleLegacy;
export const PATCH = handleLegacy;
export const DELETE = handleLegacy;
