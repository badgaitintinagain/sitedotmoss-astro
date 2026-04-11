import { NextRequest, NextResponse } from 'next/server';
import { db, comments } from '@/lib/db';
import { eq, and, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const slug = request.nextUrl.searchParams.get('slug');
    
    if (!slug) {
      return NextResponse.json(
        { error: 'Slug parameter is required' },
        { status: 400 }
      );
    }

    const approvedComments = await db
      .select()
      .from(comments)
      .where(and(
        eq(comments.postSlug, slug),
        eq(comments.status, 'approved')
      ))
      .orderBy(desc(comments.createdAt));

    return NextResponse.json({ comments: approvedComments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}
