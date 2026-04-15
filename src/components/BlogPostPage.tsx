"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, User, Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

interface Post {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  coverImage?: string;
  authorName: string;
  tags: string[];
  createdAt: Date;
}

interface Comment {
  id: string;
  authorName: string;
  content: string;
  createdAt: Date;
  status: string;
}

export default function BlogPostPage() {
  const SITE_UI_MODE_KEY = 'site-ui-mode';
  const SITE_UI_MODE_EVENT = 'site-ui-mode-change';
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentForm, setCommentForm] = useState({ name: '', content: '' });
  const [submitting, setSubmitting] = useState(false);
  const [uiMode, setUiMode] = useState<'apple' | 'legacy'>('apple');

  const fetchPost = async () => {
    try {
      const response = await fetch(`/api/blog/posts/by-slug?slug=${encodeURIComponent(slug)}`);
      if (response.ok) {
        const data = await response.json();
        setPost(data.post);
      }
    } catch {
      console.error('Failed to fetch post');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/blog/comments/by-post?slug=${encodeURIComponent(slug)}`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      }
    } catch {
      console.error('Failed to fetch comments');
    }
  };

  useEffect(() => {
    fetchPost();
    fetchComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const initialMode = localStorage.getItem(SITE_UI_MODE_KEY) === 'legacy' ? 'legacy' : 'apple';
    setUiMode(initialMode);
    document.documentElement.setAttribute('data-ui-mode', initialMode);

    const onSiteModeChange = (event: Event) => {
      const nextMode = (event as CustomEvent<{ mode?: string }>).detail?.mode;
      const resolvedMode = nextMode === 'legacy' ? 'legacy' : 'apple';
      setUiMode(resolvedMode);
      document.documentElement.setAttribute('data-ui-mode', resolvedMode);
    };

    window.addEventListener(SITE_UI_MODE_EVENT, onSiteModeChange as EventListener);
    return () => {
      window.removeEventListener(SITE_UI_MODE_EVENT, onSiteModeChange as EventListener);
    };
  }, []);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/blog/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postSlug: slug,
          ...commentForm,
        }),
      });

      if (response.ok) {
        setCommentForm({ name: '', content: '' });
        alert('Comment submitted! It will appear after approval.');
        fetchComments();
      }
    } catch {
      console.error('Failed to comment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground/60">Loading...</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-foreground/60 mb-4">Post not found</p>
          <button
            onClick={() => router.push('/')}
            className="text-accent-primary hover:underline"
          >
            Back to home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-foreground/10 bg-background/80 backdrop-blur-xl py-3">
        <div className="max-w-6xl mx-auto px-3 md:px-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/blog')}
              className="flex items-center gap-2 text-foreground/60 hover:text-foreground transition-colors"
            >
              <ArrowLeft size={18} />
              <span className="hidden md:inline text-sm">Back</span>
            </button>
            <h1 className="text-sm font-medium text-foreground">Post</h1>
            <div className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-foreground/5 text-foreground/55">
              {uiMode === 'apple' ? 'Apple UI' : 'Classic UI'}
            </div>
          </div>
        </div>
      </header>

      {uiMode === 'apple' ? (
        <main className="max-w-6xl mx-auto px-3 md:px-4 py-5 md:py-8">
          <article className="grid gap-4 md:gap-6 lg:grid-cols-[1.25fr_0.75fr]">
            <section className="rounded-[2rem] border border-foreground/10 bg-foreground/[0.03] overflow-hidden">
              {post.coverImage && (
                <div className="relative aspect-[16/10] md:aspect-[16/9] bg-black">
                  <Image
                    src={post.coverImage}
                    alt={post.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 66vw"
                    className="object-cover"
                    priority
                  />
                </div>
              )}
              <div className="p-5 md:p-8">
                <p className="text-[11px] uppercase tracking-[0.2em] text-foreground/45">{post.authorName}</p>
                <h1 className="mt-3 text-3xl md:text-5xl tracking-tight leading-tight text-foreground">{post.title}</h1>
                {post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {post.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2.5 py-1 bg-accent-primary/12 text-accent-primary rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-3 text-xs text-foreground/50">{new Date(post.createdAt).toLocaleDateString()}</div>
              </div>
            </section>

            <aside className="rounded-[2rem] border border-foreground/10 bg-background/85 p-4 md:p-5">
              <h2 className="text-sm uppercase tracking-[0.2em] text-foreground/45">Conversation</h2>
              <p className="mt-2 text-sm text-foreground/65">Comments ({comments.length})</p>
              <form onSubmit={handleCommentSubmit} className="mt-4 space-y-2">
                <input
                  type="text"
                  required
                  placeholder="Your name *"
                  value={commentForm.name}
                  onChange={(e) => setCommentForm({ ...commentForm, name: e.target.value })}
                  className="w-full bg-foreground/5 border border-foreground/10 rounded-xl py-2.5 px-3 text-xs text-foreground focus:outline-none focus:border-accent-primary/50 transition-all"
                />
                <textarea
                  required
                  placeholder="Your comment *"
                  value={commentForm.content}
                  onChange={(e) => setCommentForm({ ...commentForm, content: e.target.value })}
                  className="w-full bg-foreground/5 border border-foreground/10 rounded-xl py-2.5 px-3 text-xs text-foreground focus:outline-none focus:border-accent-primary/50 transition-all resize-none"
                  rows={4}
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-accent-primary/20 hover:bg-accent-primary/30 disabled:opacity-50 text-accent-primary text-xs font-medium rounded-xl transition-all"
                >
                  <Send size={14} />
                  <span>{submitting ? 'Posting...' : 'Post Comment'}</span>
                </button>
              </form>

              <div className="mt-4 space-y-3 max-h-[28rem] overflow-y-auto pr-1">
                {comments.length === 0 ? (
                  <p className="text-xs text-foreground/40 text-center py-6">No comments yet. Be the first!</p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="flex gap-2 pb-3 border-b border-foreground/5 last:border-0">
                      <div className="w-7 h-7 rounded-full bg-accent-primary/20 flex items-center justify-center flex-shrink-0">
                        <User size={12} className="text-accent-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-medium text-foreground text-xs">{comment.authorName}</p>
                          <span className="text-[10px] text-foreground/40">{new Date(comment.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-xs text-foreground/80 leading-relaxed">{comment.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </aside>
          </article>

          <section className="mt-4 md:mt-6 rounded-[2rem] border border-foreground/10 bg-background/88 p-5 md:p-8">
            <div className="prose prose-sm dark:prose-invert max-w-none
              prose-headings:text-foreground prose-p:text-foreground/80
              prose-a:text-accent-primary prose-strong:text-foreground
              prose-code:text-accent-primary prose-code:bg-accent-primary/10
              prose-img:rounded-lg prose-img:w-full prose-img:h-auto">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={{
                  img: ({ ...props }) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      {...props}
                      alt={props.alt || 'Blog image'}
                      className="w-full h-auto rounded-lg my-4"
                      loading="lazy"
                    />
                  ),
                }}
              >
                {post.content}
              </ReactMarkdown>
            </div>
          </section>
        </main>
      ) : (
        <main className="max-w-5xl mx-auto">
          <div className="lg:flex lg:h-[calc(100vh-61px)]">
            {post.coverImage && (
              <div className="lg:w-3/5 bg-black flex items-center justify-center lg:sticky lg:top-[61px] lg:h-[calc(100vh-61px)]">
                <div className="relative w-full aspect-square lg:aspect-auto lg:h-full">
                  <Image
                    src={post.coverImage}
                    alt={post.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 60vw"
                    className="object-contain"
                    priority
                  />
                </div>
              </div>
            )}

            <div className="lg:w-2/5 bg-background lg:overflow-y-auto">
              <article className="p-3 md:p-4">
                <div className="border-b border-foreground/10 pb-3 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-accent-primary/20 flex items-center justify-center">
                      <User size={14} className="text-accent-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-xs">{post.authorName}</p>
                      <p className="text-[10px] text-foreground/60">{new Date(post.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <h1 className="text-xl md:text-2xl font-medium text-foreground mb-2">{post.title}</h1>
                  {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {post.tags.map((tag, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 bg-accent-primary/10 text-accent-primary rounded-full">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="prose prose-sm dark:prose-invert max-w-none mb-6
                  prose-headings:text-foreground prose-p:text-foreground/80
                  prose-a:text-accent-primary prose-strong:text-foreground
                  prose-code:text-accent-primary prose-code:bg-accent-primary/10
                  prose-img:rounded-lg prose-img:w-full prose-img:h-auto">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                    components={{
                      img: ({ ...props }) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          {...props}
                          alt={props.alt || 'Blog image'}
                          className="w-full h-auto rounded-lg my-4"
                          loading="lazy"
                        />
                      ),
                    }}
                  >
                    {post.content}
                  </ReactMarkdown>
                </div>

                <div className="border-t border-foreground/10 pt-4">
                  <h2 className="text-base font-medium text-foreground mb-4">Comments ({comments.length})</h2>
                  <form onSubmit={handleCommentSubmit} className="mb-6 space-y-2">
                    <input
                      type="text"
                      required
                      placeholder="Your name *"
                      value={commentForm.name}
                      onChange={(e) => setCommentForm({ ...commentForm, name: e.target.value })}
                      className="bg-foreground/5 border border-foreground/10 rounded-lg py-2 px-3 text-xs text-foreground focus:outline-none focus:border-accent-primary/50 transition-all"
                    />
                    <textarea
                      required
                      placeholder="Your comment *"
                      value={commentForm.content}
                      onChange={(e) => setCommentForm({ ...commentForm, content: e.target.value })}
                      className="w-full bg-foreground/5 border border-foreground/10 rounded-lg py-2 px-3 text-xs text-foreground focus:outline-none focus:border-accent-primary/50 transition-all resize-none"
                      rows={3}
                    />
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-accent-primary/20 hover:bg-accent-primary/30 disabled:opacity-50 text-accent-primary text-xs font-medium rounded-lg transition-all"
                    >
                      <Send size={14} />
                      <span>{submitting ? 'Posting...' : 'Post Comment'}</span>
                    </button>
                  </form>

                  <div className="space-y-3">
                    {comments.length === 0 ? (
                      <p className="text-xs text-foreground/40 text-center py-6">No comments yet. Be the first!</p>
                    ) : (
                      comments.map((comment) => (
                        <div key={comment.id} className="flex gap-2 pb-3 border-b border-foreground/5 last:border-0">
                          <div className="w-7 h-7 rounded-full bg-accent-primary/20 flex items-center justify-center flex-shrink-0">
                            <User size={12} className="text-accent-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="font-medium text-foreground text-xs">{comment.authorName}</p>
                              <span className="text-[10px] text-foreground/40">{new Date(comment.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p className="text-xs text-foreground/80 leading-relaxed">{comment.content}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </article>
            </div>
          </div>
        </main>
      )}
    </div>
  );
}
