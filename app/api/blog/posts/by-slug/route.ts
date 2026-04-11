import { NextRequest, NextResponse } from 'next/server';
import { db, posts } from '@/lib/db';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const slug = request.nextUrl.searchParams.get('slug');
    
    if (!slug) {
      return NextResponse.json(
        { error: 'Slug parameter is required' },
        { status: 400 }
      );
    }

    const postList = await db
      .select()
      .from(posts)
      .where(eq(posts.slug, slug))
      .limit(1);

    const post = postList[0];

    if (!post || !post.published) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      post: {
        ...post,
        tags: post.tags ? JSON.parse(post.tags) : [],
        images: post.images ? JSON.parse(post.images) : [],
      }
    });
  } catch (error) {
    console.error('Error fetching post:', error);
    return NextResponse.json(
      { error: 'Failed to fetch post' },
      { status: 500 }
    );
  }
}
