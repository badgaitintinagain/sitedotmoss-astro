import type { APIRoute } from 'astro';

const readCookie = (cookieHeader: string | null, key: string) => {
  if (!cookieHeader) return null;
  const part = cookieHeader
    .split(';')
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${key}=`));

  if (!part) return null;
  return part.substring(key.length + 1);
};

export const GET: APIRoute = async ({ request }) => {
  try {
    const cookieValue = readCookie(request.headers.get('cookie'), 'auth_user');

    if (!cookieValue) {
      return new Response(JSON.stringify({ user: null }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }

    const user = JSON.parse(decodeURIComponent(cookieValue));

    return new Response(JSON.stringify({ user }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ user: null }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }
};
