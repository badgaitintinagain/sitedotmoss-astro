import type { APIRoute } from 'astro';

export const POST: APIRoute = async () => {
  const response = new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });

  response.headers.append('Set-Cookie', 'auth_user=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
  return response;
};
