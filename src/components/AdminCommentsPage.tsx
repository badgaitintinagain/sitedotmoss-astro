"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, Trash2, Mail, Calendar, ArrowLeft, MessageSquare, Clock, CheckCircle } from 'lucide-react';

interface Comment {
  id: string;
  postSlug: string;
  authorName: string;
  authorEmail: string;
  content: string;
  status: string;
  createdAt: Date;
}

export default function AdminCommentsPage() {
  const router = useRouter();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      await checkAuth();
      await fetchComments();
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAuth = async () => {
    const response = await fetch('/api/auth/me');
    if (!response.ok) {
      router.push('/');
    }
  };

  const fetchComments = async () => {
    try {
      const response = await fetch('/api/blog/comments/admin');
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    try {
      const response = await fetch(`/api/blog/comments/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      });

      if (response.ok) {
        fetchComments();
      }
    } catch (error) {
      console.error('Failed to approve comment:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    setProcessingId(id);
    try {
      const response = await fetch(`/api/blog/comments/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected' }),
      });

      if (response.ok) {
        fetchComments();
      }
    } catch (error) {
      console.error('Failed to reject comment:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this comment permanently?')) return;
    setProcessingId(id);
    try {
      const response = await fetch(`/api/blog/comments/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchComments();
      }
    } catch (error) {
      console.error('Failed to delete comment:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const filteredComments = comments.filter(comment => {
    if (filter === 'all') return true;
    return comment.status === filter;
  });

  const pendingCount = comments.filter(c => c.status === 'pending').length;
  const approvedCount = comments.filter(c => c.status === 'approved').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-accent-primary/30 border-t-accent-primary rounded-full animate-spin mx-auto" />
          <p className="text-sm text-foreground/50">Loading comments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative z-10">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-foreground/15 bg-background">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between py-3">
            <button
              onClick={() => router.push('/admin')}
              className="flex items-center gap-2 p-2 hover:bg-foreground/[0.08] rounded-xl transition-colors text-foreground/70 hover:text-foreground"
            >
              <ArrowLeft size={20} />
              <span className="text-sm font-medium hidden sm:inline">Dashboard</span>
            </button>
            <div className="text-center">
              <h1 className="font-semibold text-foreground">Comments</h1>
            </div>
            <div className="w-20" /> {/* Spacer for centering */}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-foreground/[0.05] border border-foreground/10 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{comments.length}</p>
            <p className="text-xs text-foreground/60 mt-0.5">Total</p>
          </div>
          <div className="bg-yellow-500/8 border border-yellow-500/20 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{pendingCount}</p>
            <p className="text-xs text-foreground/60 mt-0.5">Pending</p>
          </div>
          <div className="bg-green-500/8 border border-green-500/20 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{approvedCount}</p>
            <p className="text-xs text-foreground/60 mt-0.5">Approved</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {([
            { key: 'all' as const, label: 'All', count: comments.length, icon: MessageSquare },
            { key: 'pending' as const, label: 'Pending', count: pendingCount, icon: Clock },
            { key: 'approved' as const, label: 'Approved', count: approvedCount, icon: CheckCircle },
          ]).map((item) => (
            <button
              key={item.key}
              onClick={() => setFilter(item.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all text-sm font-medium ${
                filter === item.key
                  ? 'bg-accent-primary/15 text-accent-primary border border-accent-primary/25'
                  : 'bg-foreground/[0.05] text-foreground/70 border border-foreground/12 hover:bg-foreground/[0.08] hover:text-foreground'
              }`}
            >
              <item.icon size={15} />
              {item.label}
              <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-semibold ${
                filter === item.key ? 'bg-accent-primary/20' : 'bg-foreground/20'
              }`}>{item.count}</span>
            </button>
          ))}
        </div>

        {/* Comments List */}
        <div className="space-y-3">
          {filteredComments.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-16 h-16 bg-foreground/[0.05] border border-foreground/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MessageSquare size={24} className="text-foreground/35" />
              </div>
              <p className="font-semibold text-foreground text-lg">No {filter !== 'all' ? filter : ''} comments</p>
              <p className="text-sm text-foreground/60 mt-1">
                {filter === 'pending' ? 'All caught up! No comments waiting for approval.' : 'Comments will appear here when users leave them on your posts.'}
              </p>
            </div>
          ) : (
            filteredComments.map((comment) => {
              const isProcessing = processingId === comment.id;
              return (
                <div
                  key={comment.id}
                  className={`bg-foreground/[0.04] border border-foreground/10 rounded-2xl p-5 hover:bg-foreground/[0.07] transition-all ${isProcessing ? 'opacity-60 pointer-events-none' : ''}`}
                >
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-accent-primary/12 flex items-center justify-center flex-shrink-0">
                        <span className="text-accent-primary font-bold text-sm">{comment.authorName.charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-foreground">{comment.authorName}</span>
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            comment.status === 'pending'
                              ? 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400'
                              : comment.status === 'approved'
                              ? 'bg-green-500/15 text-green-600 dark:text-green-400'
                              : 'bg-red-500/15 text-red-600 dark:text-red-400'
                          }`}>
                            {comment.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                          <span className="flex items-center gap-1 text-xs text-foreground/55">
                            <Mail size={11} />
                            {comment.authorEmail}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-foreground/55">
                            <Calendar size={11} />
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Post reference */}
                  <div className="text-xs text-foreground/55 mb-2 pl-[52px]">
                    on <span className="text-accent-primary font-medium">{comment.postSlug}</span>
                  </div>

                  {/* Comment content */}
                  <div className="pl-[52px] mb-4">
                    <p className="text-sm text-foreground leading-relaxed">{comment.content}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pl-[52px]">
                    {comment.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(comment.id)}
                          disabled={isProcessing}
                          className="flex items-center gap-1.5 px-3.5 py-2 bg-green-500/15 hover:bg-green-500/25 text-green-600 dark:text-green-400 rounded-xl transition-colors text-sm font-semibold disabled:opacity-50"
                        >
                          <Check size={15} />
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(comment.id)}
                          disabled={isProcessing}
                          className="flex items-center gap-1.5 px-3.5 py-2 bg-red-500/15 hover:bg-red-500/25 text-red-600 dark:text-red-400 rounded-xl transition-colors text-sm font-semibold disabled:opacity-50"
                        >
                          <X size={15} />
                          Reject
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleDelete(comment.id)}
                      disabled={isProcessing}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-foreground/[0.05] border border-foreground/12 hover:bg-foreground/[0.08] text-foreground/60 hover:text-red-500 rounded-xl transition-colors text-sm font-medium ml-auto disabled:opacity-50"
                    >
                      <Trash2 size={15} />
                      Delete
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
