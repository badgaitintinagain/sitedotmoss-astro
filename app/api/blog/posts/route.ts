import { NextRequest, NextResponse } from 'next/server';
import { db, posts, postLikes, comments } from '@/lib/db';
import { desc, eq, sql, count } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    // Single query with subqueries for counts — no N+1
    const allPosts = await db
      .select({
        id: posts.id,
        title: posts.title,
        slug: posts.slug,
        excerpt: posts.excerpt,
        content: posts.content,
        coverImage: posts.coverImage,
        images: posts.images,
        authorId: posts.authorId,
        authorName: posts.authorName,
        tags: posts.tags,
        published: posts.published,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        likesCount: sql<number>`(SELECT COUNT(*) FROM post_likes WHERE post_likes.post_id = ${posts.id})`.as('likes_count'),
        commentsCount: sql<number>`(SELECT COUNT(*) FROM comments WHERE comments.post_slug = ${posts.slug})`.as('comments_count'),
      })
      .from(posts)
      .where(eq(posts.published, true))
      .orderBy(desc(posts.createdAt))
      .limit(limit);

    const postsWithParsed = allPosts.map(post => ({
      ...post,
      tags: post.tags ? JSON.parse(post.tags) : [],
      images: post.images ? JSON.parse(post.images) : [],
    }));

    return NextResponse.json({
      posts: postsWithParsed,
      total: allPosts.length
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}
