import React, { useEffect, useMemo, useState } from 'react';
import { useAuth as useClerkAuth } from '@clerk/react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Heart, MessageSquare, Plus, Send, Share2, X, Loader2, AlertTriangle, Pencil, Trash2, Reply, MoreHorizontal } from 'lucide-react';
import { CommunityComment, CommunityPost } from '../types';

const COMMENT_REP_REWARD = 5;
const POST_REP_REWARD = 25;
type PostCategory = CommunityPost['category'];

const formatPostTime = (value: string) => new Date(value).toLocaleString();

export const CommunityPage: React.FC = () => {
  const { user, posts, commentsByPost, addPost, toggleLikePost, loadPostComments, updateProfile } = useAuth();
  const { toggleCommentLike } = useNotifications();
  const { getToken } = useClerkAuth();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postCategory, setPostCategory] = useState<PostCategory>('Build in Public');
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [openCommentsFor, setOpenCommentsFor] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [commentLikeBusy, setCommentLikeBusy] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [commentActionBusy, setCommentActionBusy] = useState<string | null>(null);
  const [commentCountOverrides, setCommentCountOverrides] = useState<Record<string, number>>({});
  const [replyTargetId, setReplyTargetId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [displayPosts, setDisplayPosts] = useState<CommunityPost[]>([]);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editingPostTitle, setEditingPostTitle] = useState('');
  const [editingPostContent, setEditingPostContent] = useState('');
  const [editingPostCategory, setEditingPostCategory] = useState<PostCategory>('Build in Public');
  const [postActionBusy, setPostActionBusy] = useState<string | null>(null);
  const [postActionError, setPostActionError] = useState<string | null>(null);

  const categories = ['All', 'Build in Public', 'Questions', 'Projects', 'Hackathons', 'AI', 'Android'];

  useEffect(() => setDisplayPosts(posts), [posts]);

  const filteredPosts = selectedCategory === 'All' ? displayPosts : displayPosts.filter((post) => post.category === selectedCategory);
  const activeCommentPost = openCommentsFor ? displayPosts.find((post) => post.id === openCommentsFor) : null;
  const activeComments = openCommentsFor ? commentsByPost[openCommentsFor] || [] : [];
  const activeCommentCount = openCommentsFor ? commentCountOverrides[openCommentsFor] ?? activeCommentPost?.commentsCount ?? activeComments.length : 0;

  useEffect(() => {
    if (!openCommentsFor) return;
    setCommentText('');
    setReplyTargetId(null);
    setReplyText('');
    setEditingCommentId(null);
    setEditingCommentText('');
    setCommentError(null);
    setCommentsLoading(true);
    void loadPostComments(openCommentsFor)
      .catch((err: any) => setCommentError(err?.message || 'Could not load comments.'))
      .finally(() => setCommentsLoading(false));
  }, [openCommentsFor, loadPostComments]);

  useEffect(() => {
    const handleOpenCommunityPost = (event: Event) => {
      const postId = (event as CustomEvent<{ postId?: string }>).detail?.postId;
      if (!postId) return;

      // Close the publish flow first, then open the exact existing post's
      // discussion using the CommunityPage's existing comments modal.
      setPublishError(null);
      setShowNewPostModal(false);
      setOpenCommentsFor(postId);
    };

    window.addEventListener('devcollective:open-community-post', handleOpenCommunityPost);
    return () => window.removeEventListener('devcollective:open-community-post', handleOpenCommunityPost);
  }, []);

  const serviceFetch = async (basePath: string, path: string, init: RequestInit = {}) => {
    const baseUrl = String(import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
    if (!baseUrl) throw new Error('Supabase URL is not configured.');
    const token = await getToken();
    if (!token) throw new Error('Not authenticated.');
    const headers = new Headers(init.headers);
    headers.set('Authorization', `Bearer ${token}`);
    headers.set('Content-Type', 'application/json');
    const response = await fetch(`${baseUrl}/functions/v1/${basePath}${path}`, { ...init, headers });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Community request failed.');
    return data;
  };

  const syncRepFromServer = async (rep: unknown) => {
    if (typeof rep === 'number' && Number.isFinite(rep)) await updateProfile({ rep });
  };

  const resetPostEditor = () => {
    setEditingPostId(null);
    setEditingPostTitle('');
    setEditingPostContent('');
    setEditingPostCategory('Build in Public');
    setPostActionError(null);
  };

  const handleCreatePost = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!postContent.trim() || !user || isPublishing) return;
    setIsPublishing(true);
    setPublishError(null);
    try {
      await addPost({ authorName: user.name, authorCollege: user.college, authorAvatar: user.avatar, authorRole: user.role, authorRep: user.rep, category: postCategory, title: postTitle.trim() || undefined, content: postContent.trim() });
      setPostTitle('');
      setPostContent('');
      setShowNewPostModal(false);
    } catch (err: any) {
      setPublishError(err?.message || 'Could not publish your post. Please try again.');
    } finally {
      setIsPublishing(false);
    }
  };

  const beginEditPost = (post: CommunityPost) => {
    setPostActionError(null);
    setEditingPostId(post.id);
    setEditingPostTitle(post.title || '');
    setEditingPostContent(post.content);
    setEditingPostCategory(post.category);
  };

  const handleUpdatePost = async () => {
    if (!editingPostId || !editingPostContent.trim() || postActionBusy) return;
    setPostActionBusy(editingPostId);
    setPostActionError(null);
    try {
      const data = await serviceFetch('community-posts', `?postId=${encodeURIComponent(editingPostId)}`, {
        method: 'PUT',
        body: JSON.stringify({ title: editingPostTitle.trim(), content: editingPostContent.trim(), category: editingPostCategory }),
      });
      if (data.post) setDisplayPosts((prev) => prev.map((post) => post.id === editingPostId ? { ...post, ...data.post, likedByMe: post.likedByMe } : post));
      resetPostEditor();
    } catch (err: any) {
      setPostActionError(err?.message || 'Could not update your post.');
    } finally {
      setPostActionBusy(null);
    }
  };

  const handleDeletePost = async (post: CommunityPost) => {
    if (!user || postActionBusy) return;
    if (!window.confirm(`Delete “${post.title || 'this post'}”? This cannot be undone.`)) return;
    setPostActionBusy(post.id);
    setPostActionError(null);
    try {
      const data = await serviceFetch('community-posts', `?postId=${encodeURIComponent(post.id)}`, { method: 'DELETE' });
      setDisplayPosts((prev) => prev.filter((item) => item.id !== post.id));
      setCommentCountOverrides((prev) => { const next = { ...prev }; delete next[post.id]; return next; });
      if (openCommentsFor === post.id) setOpenCommentsFor(null);
      await syncRepFromServer(data.rep);
      if (editingPostId === post.id) resetPostEditor();
    } catch (err: any) {
      setPostActionError(err?.message || 'Could not delete your post.');
    } finally {
      setPostActionBusy(null);
    }
  };

  const handleSubmitComment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!openCommentsFor || !commentText.trim() || commentSubmitting || replySubmitting) return;
    setCommentSubmitting(true);
    setCommentError(null);
    try {
      const data = await serviceFetch('community-comments', '', { method: 'POST', body: JSON.stringify({ postId: openCommentsFor, content: commentText.trim() }) });
      await loadPostComments(openCommentsFor);
      setCommentCountOverrides((prev) => ({ ...prev, [openCommentsFor]: Number(data.count) || prev[openCommentsFor] || 0 }));
      await syncRepFromServer(data.rep);
      setCommentText('');
    } catch (err: any) {
      setCommentError(err?.message || 'Could not add your comment.');
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleSubmitReply = async (parentCommentId: string) => {
    if (!openCommentsFor || !replyText.trim() || replySubmitting || commentSubmitting) return;
    setReplySubmitting(true);
    setCommentError(null);
    try {
      const data = await serviceFetch('community-comments', '', { method: 'POST', body: JSON.stringify({ postId: openCommentsFor, parentCommentId, content: replyText.trim() }) });
      await loadPostComments(openCommentsFor);
      setCommentCountOverrides((prev) => ({ ...prev, [openCommentsFor]: Number(data.count) || prev[openCommentsFor] || 0 }));
      await syncRepFromServer(data.rep);
      setReplyTargetId(null);
      setReplyText('');
    } catch (err: any) {
      setCommentError(err?.message || 'Could not add your reply.');
    } finally {
      setReplySubmitting(false);
    }
  };

  const beginEditComment = (comment: CommunityComment) => {
    setCommentError(null);
    setEditingCommentId(comment.id);
    setEditingCommentText(comment.content);
    setReplyTargetId(null);
  };

  const cancelEditComment = () => {
    setEditingCommentId(null);
    setEditingCommentText('');
  };

  const handleUpdateComment = async (commentId: string) => {
    if (!openCommentsFor || !editingCommentText.trim() || commentActionBusy) return;
    setCommentActionBusy(commentId);
    setCommentError(null);
    try {
      await serviceFetch('community-comments', `?commentId=${encodeURIComponent(commentId)}`, { method: 'PUT', body: JSON.stringify({ content: editingCommentText.trim() }) });
      await loadPostComments(openCommentsFor);
      cancelEditComment();
    } catch (err: any) {
      setCommentError(err?.message || 'Could not update your comment.');
    } finally {
      setCommentActionBusy(null);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!openCommentsFor || commentActionBusy) return;
    if (!window.confirm('Delete this comment? You will lose the REP earned from it.')) return;
    setCommentActionBusy(commentId);
    setCommentError(null);
    try {
      const data = await serviceFetch('community-comments', `?commentId=${encodeURIComponent(commentId)}`, { method: 'DELETE' });
      await loadPostComments(openCommentsFor);
      setCommentCountOverrides((prev) => ({ ...prev, [openCommentsFor]: Number(data.count) || 0 }));
      await syncRepFromServer(data.rep);
      if (editingCommentId === commentId) cancelEditComment();
      if (replyTargetId === commentId) { setReplyTargetId(null); setReplyText(''); }
    } catch (err: any) {
      setCommentError(err?.message || 'Could not delete your comment.');
    } finally {
      setCommentActionBusy(null);
    }
  };

  const handleCommentLike = async (commentId: string) => {
    if (commentLikeBusy) return;
    setCommentLikeBusy(commentId);
    try {
      await toggleCommentLike(commentId);
      if (openCommentsFor) await loadPostComments(openCommentsFor);
    } catch (err: any) {
      setCommentError(err?.message || 'Could not update comment like.');
    } finally {
      setCommentLikeBusy(null);
    }
  };

  const roots = useMemo(() => activeComments.filter((comment) => !comment.parentCommentId), [activeComments]);
  const repliesFor = useMemo(() => {
    const map = new Map<string, CommunityComment[]>();
    activeComments.forEach((comment) => {
      if (!comment.parentCommentId) return;
      const bucket = map.get(comment.parentCommentId) || [];
      bucket.push(comment);
      map.set(comment.parentCommentId, bucket);
    });
    return map;
  }, [activeComments]);

  const renderComment = (comment: CommunityComment, depth = 0): React.ReactNode => {
    const isMine = comment.authorId === user?.id;
    const isEditing = editingCommentId === comment.id;
    const isBusy = commentActionBusy === comment.id;
    const replies = repliesFor.get(comment.id) || [];
    return (
      <div key={comment.id} className={depth > 0 ? 'ml-7 border-l-2 border-outline-variant pl-4' : ''}>
        <div className="border-2 border-outline-variant/60 p-4 bg-surface-container-low">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {comment.authorAvatar ? <img src={comment.authorAvatar} alt={comment.authorName} className="w-9 h-9 border border-outline-variant object-cover" /> : <div className="w-9 h-9 border border-outline-variant bg-dc-yellow flex items-center justify-center text-xs font-bold">{comment.authorName.slice(0, 1)}</div>}
              <div className="min-w-0">
                <p className="text-sm font-bold truncate">{comment.authorName}</p>
                <p className="font-label-mono text-[9px] uppercase text-on-surface-variant">{comment.authorRole} · {comment.authorRep} REP · {formatPostTime(comment.createdAt)}{comment.updatedAt && comment.updatedAt !== comment.createdAt ? ' · EDITED' : ''}</p>
              </div>
            </div>
            {isMine && <div className="flex items-center gap-1 shrink-0"><button onClick={() => beginEditComment(comment)} disabled={isBusy} className="p-2 border border-outline-variant hover:bg-dc-blue disabled:opacity-50" aria-label="Edit comment"><Pencil className="w-3.5 h-3.5" /></button><button onClick={() => void handleDeleteComment(comment.id)} disabled={isBusy} className="p-2 border border-outline-variant hover:bg-dc-yellow disabled:opacity-50" aria-label="Delete comment">{isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}</button></div>}
          </div>
          {isEditing ? <div className="mt-3 space-y-2"><textarea value={editingCommentText} onChange={(e) => setEditingCommentText(e.target.value.slice(0, 2000))} rows={3} className="w-full border-2 border-outline-variant bg-surface p-3 text-sm resize-none" autoFocus /><div className="flex justify-end gap-2"><button type="button" onClick={cancelEditComment} disabled={isBusy} className="px-3 py-2 border-2 border-outline-variant font-label-mono text-[9px] uppercase">Cancel</button><button type="button" onClick={() => void handleUpdateComment(comment.id)} disabled={!editingCommentText.trim() || isBusy} className="px-3 py-2 bg-primary text-on-primary border-2 border-outline-variant shadow-[2px_2px_0_#171717] font-label-mono text-[9px] uppercase font-bold">{isBusy ? 'Saving...' : 'Save edit'}</button></div></div> : <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap">{comment.content}</p>}
          <div className="mt-3 flex items-center gap-4"><button onClick={() => void handleCommentLike(comment.id)} disabled={commentLikeBusy === comment.id || isEditing} className={`inline-flex items-center gap-1.5 font-label-mono text-[10px] uppercase ${comment.likedByMe ? 'text-primary' : 'text-on-surface-variant hover:text-primary'} disabled:opacity-50`}><Heart className="w-3.5 h-3.5" fill={comment.likedByMe ? 'currentColor' : 'none'} /> {comment.likes || 0}</button><button type="button" onClick={() => { setEditingCommentId(null); setReplyTargetId((prev) => prev === comment.id ? null : comment.id); setReplyText(''); }} disabled={isEditing} className="inline-flex items-center gap-1.5 font-label-mono text-[10px] uppercase text-on-surface-variant hover:text-primary"><Reply className="w-3.5 h-3.5" /> Reply</button>{replies.length > 0 && <span className="font-label-mono text-[9px] uppercase text-on-surface-variant">{replies.length} repl{replies.length === 1 ? 'y' : 'ies'}</span>}</div>
          {replyTargetId === comment.id && <div className="mt-3 ml-4 flex gap-2"><input value={replyText} onChange={(e) => setReplyText(e.target.value.slice(0, 2000))} placeholder={`Reply to ${comment.authorName}...`} className="flex-1 border-2 border-outline-variant bg-surface p-2.5 text-sm" disabled={replySubmitting} autoFocus /><button type="button" onClick={() => void handleSubmitReply(comment.id)} disabled={!replyText.trim() || replySubmitting} className="px-4 bg-primary text-on-primary border-2 border-outline-variant font-label-mono text-[9px] uppercase font-bold disabled:opacity-50">{replySubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Reply'}</button></div>}
        </div>
        {replies.length > 0 && <div className="mt-3 space-y-3">{replies.map((reply) => renderComment(reply, depth + 1))}</div>}
      </div>
    );
  };

  return <div className="space-y-8 pb-16">
    <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b-2 border-outline-variant pb-7">
      <div><p className="font-label-mono text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">COMMUNITY / LIVE DATA</p><h2 className="dc-display text-5xl sm:text-6xl mt-2">COMMUNITY.</h2><p className="mt-4 text-sm text-on-surface-variant max-w-xl">Posts are created by real DevCollective users. Nothing is pre-seeded.</p></div>
      <button onClick={() => { setPublishError(null); setShowNewPostModal(true); }} className="px-5 py-3 bg-primary text-on-primary border-2 border-outline-variant shadow-[4px_4px_0_#171717] font-label-mono text-[10px] uppercase font-bold flex items-center gap-2"><Plus className="w-4 h-4" /> New Post</button>
    </section>

    <div className="flex flex-wrap gap-2">{categories.map((category) => <button key={category} onClick={() => setSelectedCategory(category)} className={`px-3 py-2 border-2 border-outline-variant font-label-mono text-[10px] uppercase font-bold ${selectedCategory === category ? 'bg-primary text-on-primary shadow-[3px_3px_0_#171717]' : 'bg-surface'}`}>{category}</button>)}</div>

    {postActionError && <p className="text-xs text-error flex items-center gap-2"><AlertTriangle className="w-4 h-4" />{postActionError}</p>}

    <section className="space-y-5"><p className="font-label-mono text-[10px] uppercase text-on-surface-variant">{selectedCategory} / {filteredPosts.length} POSTS</p>{filteredPosts.length === 0 ? <div className="border-2 border-dashed border-outline-variant bg-surface p-12 text-center"><MessageSquare className="w-7 h-7 mx-auto mb-4 text-primary" /><h3 className="dc-display text-3xl">NO POSTS YET.</h3><p className="text-sm text-on-surface-variant mt-3">Be the first real member to publish something here.</p><button onClick={() => { setPublishError(null); setShowNewPostModal(true); }} className="mt-5 border-2 border-outline-variant bg-dc-mint px-4 py-3 font-label-mono text-[10px] uppercase font-bold">CREATE FIRST POST</button></div> : filteredPosts.map((post) => {
      const isMine = post.authorId === user?.id;
      const isBusy = postActionBusy === post.id;
      return <article key={post.id} className="border-2 border-outline-variant bg-surface p-6 shadow-[4px_4px_0_#171717]">
        <div className="flex items-start justify-between gap-4 mb-4"><div className="flex items-center gap-3">{post.authorAvatar ? <img src={post.authorAvatar} alt={post.authorName} className="w-11 h-11 border-2 border-outline-variant object-cover" /> : <div className="w-11 h-11 border-2 border-outline-variant bg-dc-yellow flex items-center justify-center font-bold">{post.authorName.slice(0,1)}</div>}<div><h4 className="font-bold">{post.authorName}</h4><p className="font-label-mono text-[9px] uppercase text-on-surface-variant">{post.authorCollege} · {formatPostTime(post.createdAt)}{post.updatedAt && post.updatedAt !== post.createdAt ? ' · EDITED' : ''}</p></div></div><div className="flex items-center gap-2"><span className="font-label-mono text-[9px] uppercase border-2 border-outline-variant px-2 py-1 bg-dc-blue">{post.category}</span>{isMine && <div className="flex items-center gap-1"><button onClick={() => beginEditPost(post)} disabled={isBusy} className="p-2 border-2 border-outline-variant hover:bg-dc-blue disabled:opacity-50" aria-label="Edit post"><Pencil className="w-4 h-4" /></button><button onClick={() => void handleDeletePost(post)} disabled={isBusy} className="p-2 border-2 border-outline-variant hover:bg-dc-pink disabled:opacity-50" aria-label="Delete post">{isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}</button><button className="p-2 border-2 border-outline-variant hover:bg-surface" aria-label="More post options"><MoreHorizontal className="w-4 h-4" /></button></div>}</div></div>
        {post.title && <h3 className="font-bold text-lg mb-2">{post.title}</h3>}
        <p className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-wrap">{post.content}</p>
        <div className="flex items-center gap-5 mt-5 pt-4 border-t-2 border-outline-variant font-label-mono text-[10px]"><button onClick={() => void toggleLikePost(post.id)} className={`flex items-center gap-2 ${post.likedByMe ? 'text-primary' : ''}`}><Heart className="w-4 h-4" fill={post.likedByMe ? 'currentColor' : 'none'} /> {post.likes}</button><button onClick={() => setOpenCommentsFor(post.id)} className="flex items-center gap-2 hover:text-primary"><MessageSquare className="w-4 h-4" /> {commentCountOverrides[post.id] ?? post.commentsCount}</button><span className="ml-auto font-label-mono text-[9px] uppercase text-on-surface-variant">+{POST_REP_REWARD} REP ON PUBLISH</span><button className="ml-2"><Share2 className="w-4 h-4" /></button></div>
      </article>;
    })}</section>

    {showNewPostModal && <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md"><div className="bg-surface border-2 border-outline-variant p-6 max-w-lg w-full shadow-[7px_7px_0_#171717] relative"><button onClick={() => !isPublishing && setShowNewPostModal(false)} className="absolute top-3 right-3 disabled:opacity-40" disabled={isPublishing}><X className="w-5 h-5" /></button><p className="font-label-mono text-[10px] uppercase text-on-surface-variant">COMMUNITY / PUBLISH</p><h3 className="dc-display text-4xl mt-2 mb-6">YOUR UPDATE.</h3><form onSubmit={handleCreatePost} className="space-y-4"><select value={postCategory} onChange={(e) => setPostCategory(e.target.value as PostCategory)} className="w-full border-2 border-outline-variant bg-surface p-3 text-sm" disabled={isPublishing}>{categories.slice(1).map((category) => <option key={category}>{category}</option>)}</select><input value={postTitle} onChange={(e) => setPostTitle(e.target.value)} placeholder="Title (optional)" className="w-full border-2 border-outline-variant bg-surface p-3 text-sm" disabled={isPublishing} /><textarea value={postContent} onChange={(e) => setPostContent(e.target.value)} rows={5} placeholder="What are you building?" className="w-full border-2 border-outline-variant bg-surface p-3 text-sm resize-none" required disabled={isPublishing} />{publishError && <p className="text-xs text-error flex items-center gap-2"><AlertTriangle className="w-4 h-4 shrink-0" />{publishError}</p>}<button type="submit" disabled={isPublishing} className="w-full bg-primary border-2 border-outline-variant py-3 font-label-mono text-[10px] uppercase font-bold shadow-[4px_4px_0_#171717] flex items-center justify-center gap-2 disabled:opacity-60">{isPublishing ? <><Loader2 className="w-4 h-4 animate-spin" /> Publishing...</> : <><Send className="w-4 h-4" /> Publish Post (+{POST_REP_REWARD} REP)</>}</button></form></div></div>}

    {editingPostId && <div className="fixed inset-0 z-[55] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md"><div className="bg-surface border-2 border-outline-variant p-6 max-w-lg w-full shadow-[7px_7px_0_#171717] relative"><button onClick={() => !postActionBusy && resetPostEditor()} className="absolute top-3 right-3"><X className="w-5 h-5" /></button><p className="font-label-mono text-[10px] uppercase text-on-surface-variant">COMMUNITY / EDIT POST</p><h3 className="dc-display text-4xl mt-2 mb-6">REFINE YOUR UPDATE.</h3><div className="space-y-4"><select value={editingPostCategory} onChange={(e) => setEditingPostCategory(e.target.value as PostCategory)} className="w-full border-2 border-outline-variant bg-surface p-3 text-sm" disabled={Boolean(postActionBusy)}>{categories.slice(1).map((category) => <option key={category}>{category}</option>)}</select><input value={editingPostTitle} onChange={(e) => setEditingPostTitle(e.target.value)} placeholder="Title (optional)" className="w-full border-2 border-outline-variant bg-surface p-3 text-sm" disabled={Boolean(postActionBusy)} /><textarea value={editingPostContent} onChange={(e) => setEditingPostContent(e.target.value.slice(0, 5000))} rows={7} className="w-full border-2 border-outline-variant bg-surface p-3 text-sm resize-none" disabled={Boolean(postActionBusy)} />{postActionError && <p className="text-xs text-error flex items-center gap-2"><AlertTriangle className="w-4 h-4" />{postActionError}</p>}<div className="flex justify-end gap-2"><button onClick={resetPostEditor} disabled={Boolean(postActionBusy)} className="px-4 py-3 border-2 border-outline-variant font-label-mono text-[10px] uppercase">Cancel</button><button onClick={() => void handleUpdatePost()} disabled={!editingPostContent.trim() || Boolean(postActionBusy)} className="px-4 py-3 bg-primary text-on-primary border-2 border-outline-variant font-label-mono text-[10px] uppercase font-bold">{postActionBusy ? 'Saving...' : 'Save Post'}</button></div></div></div></div>}

    {activeCommentPost && <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md"><div className="bg-surface border-2 border-outline-variant p-6 max-w-3xl w-full max-h-[84vh] flex flex-col shadow-[7px_7px_0_#171717] relative"><button onClick={() => setOpenCommentsFor(null)} className="absolute top-3 right-3 p-1" aria-label="Close comments"><X className="w-5 h-5" /></button><p className="font-label-mono text-[10px] uppercase text-on-surface-variant">COMMUNITY / COMMENTS</p><div className="flex items-end justify-between gap-4 pr-10"><h3 className="dc-display text-3xl mt-2">{activeCommentPost.title || 'DISCUSSION.'}</h3><span className="font-label-mono text-[9px] uppercase text-on-surface-variant">{activeCommentCount} comments</span></div><p className="text-sm text-on-surface-variant mt-2 line-clamp-2">{activeCommentPost.content}</p><div className="mt-5 pt-4 border-t-2 border-outline-variant overflow-y-auto flex-1 space-y-4 min-h-0">{commentsLoading ? <div className="py-10 flex items-center justify-center gap-2 text-on-surface-variant"><Loader2 className="w-4 h-4 animate-spin" /> Loading comments...</div> : commentError && activeComments.length === 0 ? <div className="py-10 text-center text-error"><AlertTriangle className="w-6 h-6 mx-auto mb-2" /><p className="text-sm">{commentError}</p></div> : roots.length === 0 ? <div className="border-2 border-dashed border-outline-variant p-8 text-center"><MessageSquare className="w-6 h-6 mx-auto mb-2 text-primary" /><p className="font-label-mono text-[10px] uppercase font-bold">NO COMMENTS YET</p><p className="text-xs text-on-surface-variant mt-2">Start the discussion for this post.</p></div> : roots.map((comment) => renderComment(comment))}</div>{commentError && activeComments.length > 0 && <p className="mt-3 text-xs text-error flex items-center gap-2"><AlertTriangle className="w-4 h-4" />{commentError}</p>}<form onSubmit={handleSubmitComment} className="mt-4 pt-4 border-t-2 border-outline-variant flex gap-3"><input value={commentText} onChange={(e) => setCommentText(e.target.value.slice(0, 2000))} placeholder="Write a comment..." className="flex-1 border-2 border-outline-variant bg-surface p-3 text-sm" disabled={commentSubmitting || replySubmitting || Boolean(editingCommentId)} /><button type="submit" disabled={!commentText.trim() || commentSubmitting || replySubmitting || Boolean(editingCommentId)} className="px-5 border-2 border-outline-variant bg-primary text-on-primary font-label-mono text-[10px] uppercase font-bold shadow-[3px_3px_0_#171717] disabled:opacity-50 flex items-center gap-2">{commentSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Comment (+{COMMENT_REP_REWARD} REP)</button></form></div></div>}
  </div>;
};
