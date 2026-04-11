"use client";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, Heart, Send, Trash2, MessageCircle, CornerDownRight, ChevronLeft, ChevronRight, Layers } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

interface Post {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  coverImage?: string;
  images: string[];
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
  parentId?: string | null;
}

interface BlogModalProps {
  slug: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function BlogModal({ slug, isOpen, onClose }: BlogModalProps) {
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentForm, setCommentForm] = useState({ name: '', content: '' });
  const [submitting, setSubmitting] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [userId, setUserId] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    // Generate or retrieve user ID
    let uid = localStorage.getItem('userId');
    if (!uid) {
      uid = crypto.randomUUID();
      localStorage.setItem('userId', uid);
    }
    setUserId(uid);

    // Check if admin
    checkAdmin();
  }, []);

  useEffect(() => {
    if (isOpen && slug) {
      setImageIndex(0);
      fetchPost();
      fetchComments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, slug, userId]);

  const checkAdmin = async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();
      setIsAdmin(data.user?.role === 'admin');
    } catch {
      setIsAdmin(false);
    }
  };

  const fetchPost = async () => {
    try {
      const response = await fetch(`/api/blog/posts/by-slug?slug=${encodeURIComponent(slug)}`);
      if (response.ok) {
        const data = await response.json();
        setPost(data.post);
        // Fetch likes after we have the post
        if (data.post?.id) {
          const likesResponse = await fetch(`/api/blog/posts/${data.post.id}/like?userId=${userId}`);
          if (likesResponse.ok) {
            const likesData = await likesResponse.json();
            setLikesCount(likesData.likesCount);
            setIsLiked(likesData.isLiked);
          }
        }
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

  const handleLike = async () => {
    if (!post?.id) return;
    try {
      const method = isLiked ? 'DELETE' : 'POST';
      const response = await fetch(`/api/blog/posts/${post.id}/like`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        const data = await response.json();
        setLikesCount(data.likesCount);
        setIsLiked(data.isLiked);
      }
    } catch {
      console.error('Failed to like post');
    }
  };

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
          name: commentForm.name,
          content: commentForm.content,
          parentId: replyingTo,
        }),
      });

      if (response.ok) {
        setCommentForm({ name: '', content: '' });
        setReplyingTo(null);
        fetchComments();
      }
    } catch {
      console.error('Failed to comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('ต้องการลบคอมเมนท์นี้หรือไม่?')) return;

    try {
      const response = await fetch(`/api/blog/comments/${commentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchComments();
      }
    } catch {
      console.error('Failed to delete comment');
    }
  };

  const getReplies = (parentId: string) => {
    return comments.filter(c => c.parentId === parentId);
  };

  const topLevelComments = comments.filter(c => !c.parentId);

  // Build the images array for carousel
  const allImages = post
    ? post.images?.length
      ? post.images
      : post.coverImage
        ? [post.coverImage]
        : []
    : [];

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-2 md:p-4">
      <div className="relative w-full max-w-6xl h-[95vh] md:h-[90vh] bg-background rounded-xl overflow-hidden flex flex-col md:flex-row shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 p-2 bg-black/60 hover:bg-black/80 rounded-full text-white transition-colors"
        >
          <X size={18} />
        </button>

        {/* Left: Image Carousel */}
        {allImages.length > 0 && (
          <div className="md:w-3/5 bg-black flex items-center justify-center relative flex-shrink-0 h-56 md:h-auto">
            <Image
              src={allImages[imageIndex]}
              alt={post.title}
              fill
              className="object-contain"
              priority
            />

            {/* Navigation: prev */}
            {imageIndex > 0 && (
              <button
                onClick={() => setImageIndex(i => i - 1)}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white transition-colors z-10"
              >
                <ChevronLeft size={18} />
              </button>
            )}

            {/* Navigation: next */}
            {imageIndex < allImages.length - 1 && (
              <button
                onClick={() => setImageIndex(i => i + 1)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white transition-colors z-10"
              >
                <ChevronRight size={18} />
              </button>
            )}

            {/* Dot indicators */}
            {allImages.length > 1 && (
              <>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                  {allImages.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setImageIndex(i)}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${
                        i === imageIndex ? 'bg-white scale-125' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
                {/* Multi-image icon */}
                <div className="absolute top-3 right-3 z-10">
                  <Layers size={20} className="text-white drop-shadow-lg" />
                </div>
                {/* Image counter */}
                <div className="absolute top-3 left-3 z-10 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                  {imageIndex + 1} / {allImages.length}
                </div>
              </>
            )}
          </div>
        )}

        {/* Right: Content & Comments */}
        <div className={`${allImages.length > 0 ? 'md:w-2/5' : 'w-full'} flex flex-col bg-background min-h-0`}>
          {/* Header */}
          <div className="border-b border-foreground/10 p-4 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-accent-primary/20 flex items-center justify-center flex-shrink-0">
                <span className="text-accent-primary font-semibold text-sm">
                  {post.authorName[0]}
                </span>
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">{post.authorName}</p>
                <p className="text-xs text-foreground/50">
                  {new Date(post.createdAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>
          </div>

          {/* Content & Comments - Scrollable */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
            {/* Post Title & Content */}
            <div className="space-y-2">
              <h1 className="text-lg font-semibold text-foreground leading-snug">{post.title}</h1>
              {post.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {post.tags.map((tag, i) => (
                    <span key={i} className="text-xs text-accent-primary font-medium">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="prose prose-sm dark:prose-invert max-w-none 
                prose-headings:text-foreground prose-p:text-foreground/80 
                prose-a:text-accent-primary prose-strong:text-foreground
                prose-img:rounded-lg prose-img:w-full">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw]}
                  components={{
                    img: ({...props}) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        {...props} 
                        alt={props.alt || 'Blog image'}
                        className="w-full h-auto rounded-lg my-2"
                        loading="lazy"
                      />
                    ),
                  }}
                >
                  {post.content}
                </ReactMarkdown>
              </div>
            </div>

            {/* Comments */}
            <div className="space-y-3 pt-3 border-t border-foreground/10">
              <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
                <MessageCircle size={15} />
                Comments ({comments.length})
              </h3>
              
              {topLevelComments.map((comment) => (
                <div key={comment.id} className="space-y-2">
                  <div className="flex gap-2">
                    <div className="w-7 h-7 rounded-full bg-accent-primary/15 flex items-center justify-center flex-shrink-0">
                      <span className="text-[11px] text-accent-primary font-semibold">
                        {comment.authorName[0]}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <p className="font-semibold text-foreground text-xs">{comment.authorName}</p>
                        <span className="text-[10px] text-foreground/40">
                          {new Date(comment.createdAt).toLocaleDateString('th-TH')}
                        </span>
                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="ml-auto text-red-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-foreground/80 leading-relaxed">{comment.content}</p>
                      <button
                        onClick={() => setReplyingTo(comment.id)}
                        className="text-xs text-foreground/40 hover:text-accent-primary transition-colors mt-1 flex items-center gap-1"
                      >
                        <CornerDownRight size={11} />
                        Reply
                      </button>
                    </div>
                  </div>

                  {/* Nested Replies */}
                  {getReplies(comment.id).map((reply) => (
                    <div key={reply.id} className="ml-9 flex gap-2">
                      <div className="w-6 h-6 rounded-full bg-foreground/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-[10px] text-foreground/60 font-semibold">
                          {reply.authorName[0]}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <p className="font-semibold text-foreground text-xs">{reply.authorName}</p>
                          <span className="text-[10px] text-foreground/40">
                            {new Date(reply.createdAt).toLocaleDateString('th-TH')}
                          </span>
                          {isAdmin && (
                            <button
                              onClick={() => handleDeleteComment(reply.id)}
                              className="ml-auto text-red-400 hover:text-red-600 transition-colors"
                            >
                              <Trash2 size={11} />
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-foreground/75 leading-relaxed">{reply.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ))}

              {topLevelComments.length === 0 && (
                <p className="text-xs text-foreground/40 text-center py-4">No comments yet. Be first!</p>
              )}
            </div>
          </div>

          {/* Like & Comment Form */}
          <div className="border-t border-foreground/10 p-4 space-y-3 bg-background flex-shrink-0">
            {/* Like Button */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleLike}
                className={`flex items-center gap-1.5 transition-all active:scale-95 ${
                  isLiked ? 'text-red-500' : 'text-foreground/60 hover:text-red-500'
                }`}
              >
                <Heart size={22} fill={isLiked ? 'currentColor' : 'none'} className="transition-transform" />
              </button>
              <span className="text-sm text-foreground/70 font-medium">
                {likesCount} {likesCount === 1 ? 'like' : 'likes'}
              </span>
            </div>

            {/* Comment Form */}
            <form onSubmit={handleCommentSubmit} className="space-y-2">
              {replyingTo && (
                <div className="flex items-center justify-between bg-accent-primary/10 px-3 py-2 rounded-lg text-xs">
                  <span className="text-accent-primary font-medium">Replying to comment...</span>
                  <button type="button" onClick={() => setReplyingTo(null)} className="text-foreground/50 hover:text-foreground">
                    <X size={13} />
                  </button>
                </div>
              )}
              <input
                type="text"
                required
                placeholder="Your name"
                value={commentForm.name}
                onChange={(e) => setCommentForm({ ...commentForm, name: e.target.value })}
                className="w-full bg-foreground/5 border border-foreground/10 rounded-lg py-2 px-3 text-xs text-foreground focus:outline-none focus:border-accent-primary/40 transition-colors"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="Add a comment..."
                  value={commentForm.content}
                  onChange={(e) => setCommentForm({ ...commentForm, content: e.target.value })}
                  className="flex-1 bg-foreground/5 border border-foreground/10 rounded-lg py-2 px-3 text-sm text-foreground focus:outline-none focus:border-accent-primary/40 transition-colors"
                />
                <button
                  type="submit"
                  disabled={submitting || !commentForm.name || !commentForm.content}
                  className="px-3 py-2 bg-accent-primary/20 hover:bg-accent-primary/30 disabled:opacity-40 text-accent-primary rounded-lg transition-all"
                >
                  <Send size={15} />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
