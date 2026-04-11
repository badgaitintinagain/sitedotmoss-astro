import { NextRequest, NextResponse } from 'next/server';

type User = { id: string; email: string; name: string; role: string };

// Use any for params to allow flexibility with different route param shapes
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RouteContext = { params: Promise<any> };

// Handler without dynamic params
type SimpleAuthHandler = (request: NextRequest, user: User) => Promise<Response>;

// Handler with dynamic params
type DynamicAuthHandler = (request: NextRequest, user: User, context: RouteContext) => Promise<Response>;

// Overloaded function signatures
export function withAuth(handler: SimpleAuthHandler, requireAdmin?: boolean): (request: NextRequest) => Promise<Response>;
export function withAuth(handler: DynamicAuthHandler, requireAdmin?: boolean): (request: NextRequest, context: RouteContext) => Promise<Response>;

// Implementation
export function withAuth(handler: SimpleAuthHandler | DynamicAuthHandler, requireAdmin = false) {
  return async (request: NextRequest, context?: RouteContext) => {
    try {
      const authCookie = request.cookies.get('auth_user');
      
      if (!authCookie) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }

      const user = JSON.parse(authCookie.value);

      if (requireAdmin && user.role !== 'admin') {
        return NextResponse.json(
          { error: 'Forbidden - Admin access required' },
          { status: 403 }
        );
      }

      // Call handler with context if provided (for dynamic routes)
      if (context) {
        return (handler as DynamicAuthHandler)(request, user, context);
      } else {
        return (handler as SimpleAuthHandler)(request, user);
      }
    } catch {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }
  };
}
