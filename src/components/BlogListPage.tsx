"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { FileText, ArrowLeft, Heart, MessageCircle, Layers, Search, Grid, List, X, Tag } from 'lucide-react';
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
  const router = useRouter();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    fetchPosts();
  }, []);

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

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-foreground/10 bg-background/80 backdrop-blur-xl">
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
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'text-accent-primary bg-accent-primary/10' : 'text-foreground/40 hover:text-foreground/70'}`}
              >
                <Grid size={16} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'text-accent-primary bg-accent-primary/10' : 'text-foreground/40 hover:text-foreground/70'}`}
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

      <main className="max-w-[935px] mx-auto px-1 md:px-2 py-4 md:py-6">
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
                  onClick={() => setSelectedSlug(post.slug)}
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
                  onClick={() => setSelectedSlug(post.slug)}
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
      {selectedSlug && (
        <BlogModal
          slug={selectedSlug}
          isOpen={!!selectedSlug}
          onClose={() => setSelectedSlug(null)}
        />
      )}
    </div>
  );
}
