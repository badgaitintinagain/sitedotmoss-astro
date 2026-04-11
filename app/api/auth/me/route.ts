import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const authCookie = request.cookies.get('auth_user');
    
    if (!authCookie) {
      return NextResponse.json({ user: null });
    }

    const user = JSON.parse(authCookie.value);
    
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ user: null });
  }
}
