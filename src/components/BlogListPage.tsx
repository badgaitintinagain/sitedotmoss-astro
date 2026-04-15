"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FileText, ArrowLeft, Heart, MessageCircle, Layers, Search, Grid, List, X, Tag, Sparkles } from 'lucide-react';
import BlogModal from '@/components/BlogModal';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage?: string;
  images: string[];
  authorName: string;
  tags: string[];
  createdAt: string;
  updatedAt?: string;
  likesCount?: number;
  commentsCount?: number;
}

export default function BlogListPage() {
  const BLOG_UI_MODE_KEY = 'blog-ui-mode';
  const BLOG_UI_MODE_EVENT = 'blog-ui-mode-change';
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [uiMode, setUiMode] = useState<'apple' | 'modal'>('apple');

  const setMode = (mode: 'apple' | 'modal') => {
    setUiMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem(BLOG_UI_MODE_KEY, mode);
      window.dispatchEvent(new CustomEvent(BLOG_UI_MODE_EVENT, { detail: { mode } }));
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const initialMode = localStorage.getItem(BLOG_UI_MODE_KEY) === 'modal' ? 'modal' : 'apple';
    setUiMode(initialMode);
    localStorage.setItem(BLOG_UI_MODE_KEY, initialMode);

    const onBlogModeChange = (event: Event) => {
      const nextMode = (event as CustomEvent<{ mode?: string }>).detail?.mode;
      setUiMode(nextMode === 'modal' ? 'modal' : 'apple');
    };

    window.addEventListener(BLOG_UI_MODE_EVENT, onBlogModeChange as EventListener);
    return () => {
      window.removeEventListener(BLOG_UI_MODE_EVENT, onBlogModeChange as EventListener);
    };
  }, []);

  useEffect(() => {
    if (uiMode === 'apple' && selectedSlug) {
      setSelectedSlug(null);
    }
  }, [uiMode, selectedSlug]);

  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/blog/posts');
      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts || []);
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Collect all unique tags
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    posts.forEach(p => p.tags?.forEach(t => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [posts]);

  // Filter posts
  const filteredPosts = useMemo(() => {
    let result = [...posts];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.excerpt?.toLowerCase().includes(q) ||
        p.tags?.some(t => t.toLowerCase().includes(q))
      );
    }
    if (selectedTag) {
      result = result.filter(p => p.tags?.includes(selectedTag));
    }
    return result;
  }, [posts, searchQuery, selectedTag]);

  const hasFilters = searchQuery || selectedTag;
  const featuredPost = filteredPosts[0];
  const spotlightPosts = filteredPosts.slice(1, 4);

  const handlePostOpen = (slug: string) => {
    if (uiMode === 'modal') {
      setSelectedSlug(slug);
      return;
    }
    router.push(`/blog/${slug}`);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_540px_at_50%_-120px,rgba(95,108,145,0.18),transparent_62%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(245,246,248,0.96))] dark:bg-[radial-gradient(1200px_540px_at_50%_-120px,rgba(127,146,196,0.2),transparent_62%),linear-gradient(180deg,rgba(10,11,14,0.98),rgba(10,11,14,0.94))]">
      <header className="sticky top-0 z-40 border-b border-foreground/10 bg-background/70 backdrop-blur-2xl">
        <div className="max-w-[935px] mx-auto px-3 md:px-4">
          {/* Top row */}
          <div className="flex items-center justify-between py-3">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 text-foreground/60 hover:text-foreground transition-colors"
            >
              <ArrowLeft size={18} />
            </button>
            <h1 className="text-base font-medium text-foreground">Blog</h1>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setMode('apple')}
                className={`px-2.5 py-1.5 rounded-full text-[11px] font-semibold transition-colors ${uiMode === 'apple' ? 'bg-foreground text-background' : 'text-foreground/50 hover:text-foreground/80 bg-foreground/5'}`}
              >
                Apple UI
              </button>
              <button
                onClick={() => setMode('modal')}
                className={`px-2.5 py-1.5 rounded-full text-[11px] font-semibold transition-colors ${uiMode === 'modal' ? 'bg-foreground text-background' : 'text-foreground/50 hover:text-foreground/80 bg-foreground/5'}`}
              >
                Modal UI
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'text-accent-primary bg-accent-primary/10' : 'text-foreground/40 hover:text-foreground/70'} ${uiMode === 'apple' ? 'opacity-40 pointer-events-none' : ''}`}
              >
                <Grid size={16} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'text-accent-primary bg-accent-primary/10' : 'text-foreground/40 hover:text-foreground/70'} ${uiMode === 'apple' ? 'opacity-40 pointer-events-none' : ''}`}
              >
                <List size={16} />
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="pb-3 flex items-center gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
              <input
                type="text"
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-foreground/[0.05] border border-foreground/10 rounded-xl text-sm text-foreground focus:outline-none focus:border-accent-primary/40 placeholder:text-foreground/35 transition-all"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground/70">
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Tag pills */}
          {allTags.length > 0 && (
            <div className="pb-3 flex gap-1.5 overflow-x-auto no-scrollbar">
              {selectedTag && (
                <button
                  onClick={() => setSelectedTag(null)}
                  className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-full bg-foreground/[0.06] text-foreground/50 hover:text-foreground/70 transition-colors"
                >
                  <X size={10} />
                  Clear
                </button>
              )}
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                  className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-full transition-colors ${
                    selectedTag === tag
                      ? 'bg-accent-primary/15 text-accent-primary'
                      : 'bg-foreground/[0.05] text-foreground/50 hover:bg-foreground/[0.08] hover:text-foreground/70'
                  }`}
                >
                  <Tag size={9} />
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-[1080px] mx-auto px-3 md:px-4 py-4 md:py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-sm text-foreground/60">Loading...</div>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FileText size={48} className="text-foreground/20 mb-3" />
            <p className="text-foreground/60">{hasFilters ? 'No matching posts' : 'No posts yet'}</p>
            <p className="text-xs text-foreground/40 mt-1">
              {hasFilters ? 'Try a different search or tag' : 'Check back soon!'}
            </p>
            {hasFilters && (
              <button
                onClick={() => { setSearchQuery(''); setSelectedTag(null); }}
                className="mt-3 text-xs text-accent-primary hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : uiMode === 'apple' ? (
          <div className="space-y-5 md:space-y-7">
            <section className="relative overflow-hidden rounded-[2rem] border border-foreground/10 bg-foreground/[0.03] px-6 py-8 md:px-10 md:py-10 shadow-[0_24px_50px_-38px_rgba(0,0,0,0.45)]">
              <div className="absolute -right-10 -top-12 h-44 w-44 rounded-full bg-accent-primary/20 blur-3xl" />
              <div className="absolute -left-14 bottom-0 h-44 w-44 rounded-full bg-accent-secondary/20 blur-3xl" />
              <p className="relative flex items-center gap-2 text-[11px] uppercase tracking-[0.26em] text-foreground/55">
                <Sparkles size={13} />
                Weekly Editorial
              </p>
              <h2 className="relative mt-3 max-w-[18ch] text-3xl leading-tight tracking-tight text-foreground md:text-5xl">
                Stories that feel like a product keynote.
              </h2>
              <p className="relative mt-3 max-w-[60ch] text-sm leading-relaxed text-foreground/65 md:text-base">
                A cleaner reading flow built for engagement and ad placement. Apple UI mode opens each post on its own page endpoint by default.
              </p>
            </section>

            {featuredPost && (
              <article
                onClick={() => handlePostOpen(featuredPost.slug)}
                className="group grid cursor-pointer overflow-hidden rounded-[2rem] border border-foreground/10 bg-background/85 shadow-[0_30px_60px_-44px_rgba(0,0,0,0.6)] backdrop-blur-xl transition-transform duration-500 hover:-translate-y-1 md:grid-cols-[1.2fr_1fr]"
              >
                <div className="relative min-h-[260px] md:min-h-[360px]">
                  {featuredPost.images?.[0] || featuredPost.coverImage ? (
                    <Image
                      src={featuredPost.images?.[0] || featuredPost.coverImage || ''}
                      alt={featuredPost.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 55vw"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-accent-primary/20 via-accent-secondary/10 to-transparent" />
                  )}
                </div>
                <div className="flex flex-col justify-between p-6 md:p-8">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-foreground/45">Featured</p>
                    <h3 className="mt-3 text-2xl leading-tight tracking-tight text-foreground md:text-3xl">{featuredPost.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-foreground/65 md:text-base line-clamp-4">
                      {featuredPost.excerpt || 'Tap to open the full story on a dedicated page.'}
                    </p>
                  </div>
                  <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-foreground/50">
                    <span>{new Date(featuredPost.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    <span className="flex items-center gap-1"><Heart size={12} /> {featuredPost.likesCount || 0}</span>
                    <span className="flex items-center gap-1"><MessageCircle size={12} /> {featuredPost.commentsCount || 0}</span>
                  </div>
                </div>
              </article>
            )}

            <section className="grid gap-3 md:grid-cols-3 md:gap-4">
              {spotlightPosts.map((post) => {
                const image = post.images?.[0] || post.coverImage;
                return (
                  <article
                    key={post.id}
                    onClick={() => handlePostOpen(post.slug)}
                    className="group cursor-pointer overflow-hidden rounded-[1.5rem] border border-foreground/10 bg-background/75 transition-all duration-300 hover:-translate-y-1 hover:border-foreground/20"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-foreground/5">
                      {image ? (
                        <Image
                          src={image}
                          alt={post.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-accent-primary/20 to-accent-secondary/10" />
                      )}
                    </div>
                    <div className="p-4">
                      <h4 className="text-base font-medium leading-snug text-foreground line-clamp-2">{post.title}</h4>
                      <p className="mt-2 text-xs leading-relaxed text-foreground/60 line-clamp-2">
                        {post.excerpt || 'Open this article in page view.'}
                      </p>
                    </div>
                  </article>
                );
              })}
            </section>

            <section className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {filteredPosts.slice(4).map((post) => {
                const image = post.images?.[0] || post.coverImage;
                return (
                  <article
                    key={post.id}
                    onClick={() => handlePostOpen(post.slug)}
                    className="group cursor-pointer rounded-2xl border border-foreground/10 bg-background/70 p-4 transition-colors hover:bg-foreground/[0.04]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-foreground/5">
                        {image ? (
                          <Image
                            src={image}
                            alt={post.title}
                            fill
                            className="object-cover"
                            sizes="56px"
                          />
                        ) : (
                          <div className="h-full w-full bg-gradient-to-br from-accent-primary/20 to-accent-secondary/10" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h5 className="text-sm font-medium text-foreground line-clamp-1">{post.title}</h5>
                        <p className="text-[11px] text-foreground/50">
                          {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>
          </div>
        ) : viewMode === 'grid' ? (
          /* ── Grid View ── */
          <div className="grid grid-cols-3 gap-0.5 md:gap-1">
            {filteredPosts.map((post) => {
              const thumbnail = post.images?.[0] || post.coverImage || null;
              const hasMultiple = (post.images?.length ?? 0) > 1;
              const displayDate = post.updatedAt && post.updatedAt !== post.createdAt
                ? new Date(post.updatedAt)
                : new Date(post.createdAt);
              const isUpdated = post.updatedAt && post.updatedAt !== post.createdAt;
              return (
                <article
                  key={post.id}
                  onClick={() => handlePostOpen(post.slug)}
                  className="group cursor-pointer bg-foreground/5 relative overflow-hidden transition-all duration-200"
                >
                  <div className="relative aspect-square">
                    {thumbnail ? (
                      <Image
                        src={thumbnail}
                        alt={post.title}
                        fill
                        sizes="(max-width: 640px) 33vw, (max-width: 935px) 33vw, 300px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-accent-primary/20 to-accent-secondary/20">
                        <FileText size={32} className="text-foreground/20" />
                      </div>
                    )}

                    {hasMultiple && (
                      <div className="absolute top-2 right-2 z-10 drop-shadow-lg">
                        <Layers size={16} className="text-white" />
                      </div>
                    )}

                    <div className="absolute inset-0 bg-black/55 transition-all duration-200 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 p-3 text-center gap-2">
                      <div className="flex items-center gap-4 text-white">
                        <span className="flex items-center gap-1.5 font-bold text-sm">
                          <Heart size={18} fill="white" />
                          {post.likesCount || 0}
                        </span>
                        <span className="flex items-center gap-1.5 font-bold text-sm">
                          <MessageCircle size={18} fill="white" />
                          {post.commentsCount || 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="px-1.5 md:px-2 py-1.5 md:py-2">
                    <h3 className="text-foreground text-xs md:text-sm font-semibold line-clamp-1 leading-snug">{post.title}</h3>
                    <p className="text-foreground/50 text-[10px] md:text-xs mt-0.5">
                      {isUpdated ? 'Updated ' : ''}
                      {displayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          /* ── List View ── */
          <div className="space-y-2 px-1 md:px-2">
            {filteredPosts.map((post) => {
              const thumbnail = post.images?.[0] || post.coverImage || null;
              const hasMultiple = (post.images?.length ?? 0) > 1;
              const displayDate = post.updatedAt && post.updatedAt !== post.createdAt
                ? new Date(post.updatedAt)
                : new Date(post.createdAt);
              const isUpdated = post.updatedAt && post.updatedAt !== post.createdAt;
              return (
                <article
                  key={post.id}
                  onClick={() => handlePostOpen(post.slug)}
                  className="flex items-center gap-3 md:gap-4 cursor-pointer bg-foreground/[0.03] hover:bg-foreground/[0.06] border border-foreground/8 rounded-xl p-2.5 md:p-3 transition-all"
                >
                  {/* Thumbnail */}
                  <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden flex-shrink-0 bg-foreground/[0.05]">
                    {thumbnail ? (
                      <Image src={thumbnail} alt={post.title} fill className="object-cover" sizes="80px" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-accent-primary/15 to-accent-secondary/15">
                        <FileText size={20} className="text-foreground/20" />
                      </div>
                    )}
                    {hasMultiple && (
                      <div className="absolute top-1 right-1 bg-black/50 rounded-sm px-0.5">
                        <Layers size={10} className="text-white" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-foreground text-sm font-semibold line-clamp-1">{post.title}</h3>
                    {post.excerpt && (
                      <p className="text-foreground/50 text-xs line-clamp-1 mt-0.5">{post.excerpt}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-foreground/45">
                      <span>
                        {isUpdated ? 'Updated ' : ''}
                        {displayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart size={11} />
                        {post.likesCount || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle size={11} />
                        {post.commentsCount || 0}
                      </span>
                    </div>
                    {post.tags?.length > 0 && (
                      <div className="flex gap-1 mt-1.5 overflow-hidden">
                        {post.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="text-[10px] text-accent-primary font-medium">#{tag}</span>
                        ))}
                        {post.tags.length > 3 && (
                          <span className="text-[10px] text-foreground/35">+{post.tags.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* Blog Modal */}
      {uiMode === 'modal' && selectedSlug && (
        <BlogModal
          slug={selectedSlug}
          isOpen={!!selectedSlug}
          onClose={() => setSelectedSlug(null)}
        />
      )}
    </div>
  );
}
