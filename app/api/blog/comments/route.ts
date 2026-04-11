import { NextRequest, NextResponse } from 'next/server';
import { db, comments } from '@/lib/db';
import { generateId } from '@/lib/auth/utils';

// Rate limiting helper (simple in-memory, use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(ip);
  
  if (!limit || now > limit.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + 60000 }); // 1 minute
    return true;
  }
  
  if (limit.count >= 3) { // Max 3 comments per minute
    return false;
  }
  
  limit.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { postSlug, name, email, content, parentId } = body;

    // Validation
    if (!postSlug || !name || !content) {
      return NextResponse.json(
        { error: 'Name and content are required' },
        { status: 400 }
      );
    }

    if (content.length > 500) {
      return NextResponse.json(
        { error: 'Comment too long (max 500 characters)' },
        { status: 400 }
      );
    }

    // Sanitize content (basic)
    const sanitizedContent = content
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .trim();

    const commentId = generateId();

    await db.insert(comments).values({
      id: commentId,
      postSlug,
      authorName: name,
      authorEmail: email || null,
      content: sanitizedContent,
      parentId: parentId || null,
      status: 'approved', // Auto-approve comments now
    });

    return NextResponse.json({ 
      success: true,
      message: 'Comment posted successfully'
    });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Failed to submit comment' },
      { status: 500 }
    );
  }
}
