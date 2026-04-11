"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Plus, Edit, Trash2, Eye, EyeOff, ArrowLeft, Search,
  MessageSquare, Layers, Grid, List, Home, LayoutDashboard
} from 'lucide-react';

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  published: boolean;
  createdAt: Date;
  tags: string[];
  coverImage?: string;
  images: string[];
  authorName: string;
  likesCount?: number;
  commentsCount?: number;
}

export default function AdminPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; email: string; name: string; role: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      await checkAuth();
      await fetchPosts();
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let filtered = [...posts];
    if (filterStatus === 'published') filtered = filtered.filter(p => p.published);
    else if (filterStatus === 'draft') filtered = filtered.filter(p => !p.published);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.excerpt?.toLowerCase().includes(q) ||
        p.tags.some(tag => tag.toLowerCase().includes(q))
      );
    }
    setFilteredPosts(filtered);
  }, [posts, searchQuery, filterStatus]);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (!data.user || data.user.role !== 'admin') router.push('/');
      else setUser(data.user);
    } catch { router.push('/'); }
  };

  const fetchPosts = async () => {
    try {
      const res = await fetch('/api/blog/posts/all');
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const togglePublish = async (id: string, current: boolean) => {
    setTogglingId(id);
    try {
      const res = await fetch(`/api/blog/posts/${id}/publish`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !current }),
      });
      if (res.ok) fetchPosts();
      else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Failed to update post status');
      }
    } catch (err) { console.error(err); alert('Network error. Please try again.'); }
    finally { setTogglingId(null); }
  };

  const deletePost = async (id: string) => {
    if (!confirm('Delete this post? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/blog/posts/${id}`, { method: 'DELETE' });
      if (res.ok) fetchPosts();
      else alert('Failed to delete post');
    } catch (err) { console.error(err); }
    finally { setDeletingId(null); }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-accent-primary/30 border-t-accent-primary rounded-full animate-spin mx-auto" />
          <p className="text-sm text-foreground/50">Checking authentication...</p>
        </div>
      </div>
    );
  }

  const stats = {
    total: posts.length,
    published: posts.filter(p => p.published).length,
    draft: posts.filter(p => !p.published).length,
  };

  // Get thumbnail for a post
  const getThumbnail = (post: Post) =>
    post.images?.[0] || post.coverImage || null;

  return (
    <div className="min-h-screen bg-background flex pb-16 md:pb-0 relative z-10">

      {/* ─── Sidebar (Desktop) ─── */}
      <aside className="w-60 bg-background border-r border-foreground/15 hidden md:flex flex-col sticky top-0 h-screen overflow-y-auto z-40">
        {/* Logo area */}
        <div className="p-5 pb-3 border-b border-foreground/10">
          <div className="flex items-center gap-2">
            <LayoutDashboard size={20} className="text-accent-primary" />
            <p className="font-bold text-lg text-foreground">Admin</p>
          </div>
          <div className="flex items-center gap-2.5 mt-3 px-1">
            <div className="w-8 h-8 rounded-full bg-accent-primary/15 flex items-center justify-center">
              <span className="text-accent-primary font-bold text-xs">{user.name.charAt(0).toUpperCase()}</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
              <p className="text-[11px] text-foreground/70 truncate">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {/* Filter buttons */}
          {([
            { label: 'All Posts', value: 'all', count: stats.total },
            { label: 'Published', value: 'published', count: stats.published },
            { label: 'Drafts', value: 'draft', count: stats.draft },
          ] as const).map(item => (
            <button
              key={item.value}
              onClick={() => setFilterStatus(item.value)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all ${
                filterStatus === item.value
                  ? 'bg-accent-primary/15 text-accent-primary font-semibold'
                  : 'text-foreground/70 hover:bg-foreground/[0.08] hover:text-foreground'
              }`}
            >
              <span>{item.label}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                filterStatus === item.value ? 'bg-accent-primary/20' : 'bg-foreground/10'
              }`}>{item.count}</span>
            </button>
          ))}

          <div className="pt-3 mt-3 border-t border-foreground/10 space-y-1">
            <button
              onClick={() => router.push('/admin/comments')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-foreground/70 hover:bg-foreground/[0.08] hover:text-foreground transition-all"
            >
              <MessageSquare size={16} />
              <span>Comments</span>
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-foreground/70 hover:bg-foreground/[0.08] hover:text-foreground transition-all"
            >
              <ArrowLeft size={16} />
              <span>Back to Site</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* ─── Mobile Bottom Navigation ─── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-foreground/15 px-2 py-1.5 flex items-center justify-around">
        <button onClick={() => router.push('/admin')} className="flex flex-col items-center gap-0.5 px-3 py-1.5 text-accent-primary">
          <LayoutDashboard size={18} />
          <span className="text-[10px] font-medium">Posts</span>
        </button>
        <button onClick={() => router.push('/admin/comments')} className="flex flex-col items-center gap-0.5 px-3 py-1.5 text-foreground/70">
          <MessageSquare size={18} />
          <span className="text-[10px] font-medium">Comments</span>
        </button>
        <button
          onClick={() => router.push('/admin/new')}
          className="flex items-center justify-center w-10 h-10 bg-accent-primary text-white rounded-full shadow-md -mt-3"
        >
          <Plus size={22} />
        </button>
        <button onClick={() => router.push('/blog')} className="flex flex-col items-center gap-0.5 px-3 py-1.5 text-foreground/70">
          <Eye size={18} />
          <span className="text-[10px] font-medium">View Blog</span>
        </button>
        <button onClick={() => router.push('/')} className="flex flex-col items-center gap-0.5 px-3 py-1.5 text-foreground/70">
          <Home size={18} />
          <span className="text-[10px] font-medium">Home</span>
        </button>
      </div>

      {/* ─── Main Content ─── */}
      <main className="flex-1 min-h-screen overflow-y-auto">
        {/* Top bar */}
        <div className="sticky top-0 z-30 bg-background border-b border-foreground/15 px-4 md:px-6 py-3">
          <div className="flex items-center gap-3 max-w-5xl mx-auto">
            {/* Mobile title */}
            <div className="md:hidden flex items-center gap-2">
              <LayoutDashboard size={18} className="text-accent-primary" />
              <span className="font-bold text-foreground">Admin</span>
            </div>

            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/50" />
              <input
                type="text"
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-foreground/[0.06] border border-foreground/15 rounded-xl text-sm focus:outline-none focus:border-accent-primary/50 text-foreground transition-all placeholder:text-foreground/40"
              />
            </div>

            {/* Mobile filter pills */}
            <div className="md:hidden flex gap-1.5 overflow-x-auto no-scrollbar">
              {([
                { key: 'all' as const, label: 'All', count: stats.total },
                { key: 'published' as const, label: 'Published', count: stats.published },
                { key: 'draft' as const, label: 'Drafts', count: stats.draft },
              ]).map(f => (
                <button
                  key={f.key}
                  onClick={() => setFilterStatus(f.key)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                    filterStatus === f.key ? 'bg-accent-primary/15 text-accent-primary border border-accent-primary/25' : 'bg-foreground/[0.06] text-foreground/70 border border-foreground/12'
                  }`}
                >
                  {f.label}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    filterStatus === f.key ? 'bg-accent-primary/20' : 'bg-foreground/20'
                  }`}>{f.count}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              {/* View toggle */}
              <div className="hidden sm:flex bg-foreground/[0.06] border border-foreground/12 rounded-lg p-0.5">
                <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-accent-primary/15 text-accent-primary' : 'text-foreground/60 hover:text-foreground'}`}>
                  <Grid size={15} />
                </button>
                <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-accent-primary/15 text-accent-primary' : 'text-foreground/60 hover:text-foreground'}`}>
                  <List size={15} />
                </button>
              </div>

              <button
                onClick={() => router.push('/admin/new')}
                className="hidden md:flex items-center gap-2 px-4 py-2 bg-accent-primary text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
              >
                <Plus size={16} />
                <span className="hidden sm:inline">New Post</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 max-w-5xl mx-auto">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-foreground/[0.05] border border-foreground/10 rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              <p className="text-xs text-foreground/60 mt-0.5">Total Posts</p>
            </div>
            <div className="bg-green-500/8 border border-green-500/20 rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.published}</p>
              <p className="text-xs text-foreground/60 mt-0.5">Published</p>
            </div>
            <div className="bg-yellow-500/8 border border-yellow-500/20 rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.draft}</p>
              <p className="text-xs text-foreground/60 mt-0.5">Drafts</p>
            </div>
          </div>

          {/* Post grid/list */}
          {loading ? (
            <div className="py-20 flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-accent-primary/30 border-t-accent-primary rounded-full animate-spin" />
              <p className="text-sm text-foreground/60">Loading posts...</p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="py-20 text-center">
              <div className="w-16 h-16 bg-foreground/[0.05] border border-foreground/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Search size={24} className="text-foreground/35" />
              </div>
              <p className="font-semibold text-foreground text-lg">No posts found</p>
              <p className="text-sm text-foreground/60 mt-1 max-w-xs mx-auto">Try adjusting your search or filters, or create a new post to get started.</p>
              <button onClick={() => router.push('/admin/new')} className="mt-5 px-5 py-2.5 bg-accent-primary text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity">
                <Plus size={16} className="inline mr-1.5 -mt-0.5" />
                Create Post
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            /* ── Grid View ── */
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5 sm:gap-2">
              {filteredPosts.map(post => {
                const thumb = getThumbnail(post);
                const hasMultiple = (post.images?.length ?? 0) > 1;
                const isDeleting = deletingId === post.id;
                const isToggling = togglingId === post.id;
                return (
                  <div key={post.id} className={`relative aspect-square bg-foreground/[0.06] overflow-hidden rounded-xl group border border-foreground/10 ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}>
                    {thumb ? (
                      <Image src={thumb} alt={post.title} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-accent-primary/10 to-accent-secondary/10">
                        <span className="text-3xl font-bold text-foreground/25">{post.title.charAt(0)}</span>
                      </div>
                    )}

                    {/* Multi-image indicator */}
                    {hasMultiple && (
                      <div className="absolute top-2.5 right-2.5 bg-black/50 rounded-md px-1.5 py-0.5 flex items-center gap-1">
                        <Layers size={12} className="text-white" />
                        <span className="text-white text-[10px] font-semibold">{post.images?.length}</span>
                      </div>
                    )}

                    {/* Status badge */}
                    <div className={`absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${
                      post.published
                        ? 'bg-green-500/80 text-white'
                        : 'bg-yellow-500/80 text-white'
                    }`}>
                      {post.published ? 'Live' : 'Draft'}
                    </div>

                    {/* Always-visible action bar */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-12 px-2.5 pb-2.5">
                      <p className="text-white text-xs font-semibold truncate mb-2">{post.title}</p>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => router.push(`/admin/edit/${post.id}`)}
                          className="flex-1 py-2 bg-white/20 hover:bg-white/30 active:bg-white/40 backdrop-blur-sm rounded-lg text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Edit size={13} /> Edit
                        </button>
                        <button
                          onClick={() => togglePublish(post.id, post.published)}
                          disabled={isToggling}
                          className={`p-2 backdrop-blur-sm rounded-lg text-white transition-colors disabled:opacity-50 ${
                            post.published
                              ? 'bg-green-500/40 hover:bg-green-500/60'
                              : 'bg-white/20 hover:bg-white/30'
                          }`}
                          title={post.published ? 'Unpublish' : 'Publish'}
                        >
                          {post.published ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        <button
                          onClick={() => deletePost(post.id)}
                          disabled={isDeleting}
                          className="p-2 bg-red-500/60 hover:bg-red-500/80 active:bg-red-600 backdrop-blur-sm rounded-lg text-white transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ── List View ── */
            <div className="space-y-2">
              {filteredPosts.map(post => {
                const thumb = getThumbnail(post);
                const hasMultiple = (post.images?.length ?? 0) > 1;
                const isDeleting = deletingId === post.id;
                return (
                  <div key={post.id} className={`flex items-center gap-4 bg-foreground/[0.04] hover:bg-foreground/[0.08] border border-foreground/10 rounded-2xl p-3 transition-all ${isDeleting ? 'opacity-50' : ''}`}>
                    {/* Thumbnail */}
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-foreground/[0.06]">
                      {thumb ? (
                        <Image src={thumb} alt={post.title} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-accent-primary/10 to-accent-secondary/10">
                          <span className="text-xl font-bold text-foreground/30">{post.title.charAt(0)}</span>
                        </div>
                      )}
                      {hasMultiple && (
                        <div className="absolute top-1 right-1 bg-black/50 rounded-sm px-1">
                          <Layers size={10} className="text-white" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-semibold text-foreground text-sm truncate">{post.title || 'Untitled'}</p>
                        <span className={`flex-shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          post.published ? 'bg-green-500/15 text-green-600 dark:text-green-400' : 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400'
                        }`}>
                          {post.published ? 'Live' : 'Draft'}
                        </span>
                      </div>
                      <p className="text-xs text-foreground/70 truncate">{post.excerpt || 'No description'}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-foreground/55">
                        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                        {post.tags.slice(0, 2).map(tag => (
                          <span key={tag} className="text-accent-primary">#{tag}</span>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => router.push(`/admin/edit/${post.id}`)}
                        className="p-2 text-foreground/60 hover:text-accent-primary hover:bg-accent-primary/10 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => togglePublish(post.id, post.published)}
                        className={`p-2 rounded-lg transition-colors ${post.published ? 'text-green-500 hover:bg-green-500/10' : 'text-foreground/60 hover:bg-foreground/[0.08] hover:text-foreground'}`}
                        title={post.published ? 'Unpublish' : 'Publish'}
                      >
                        {post.published ? <Eye size={16} /> : <EyeOff size={16} />}
                      </button>
                      <button
                        onClick={() => deletePost(post.id)}
                        className="p-2 text-foreground/60 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

