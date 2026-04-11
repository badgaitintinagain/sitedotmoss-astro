import type { APIRoute } from 'astro';
import { db, users } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { verifyPassword } from '@/lib/auth/utils';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email and password are required' }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      });
    }

    const userList = await db.select().from(users).where(eq(users.email, email)).limit(1);
    const user = userList[0];

    if (!user) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
        headers: { 'content-type': 'application/json' },
      });
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
        headers: { 'content-type': 'application/json' },
      });
    }

    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
    };

    const response = new Response(
      JSON.stringify({
        success: true,
        user: userData,
      }),
      {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }
    );

    const secure = import.meta.env.PROD ? '; Secure' : '';
    response.headers.append(
      'Set-Cookie',
      `auth_user=${encodeURIComponent(JSON.stringify(userData))}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}${secure}`
    );

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return new Response(JSON.stringify({ error: 'Login failed' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
};
