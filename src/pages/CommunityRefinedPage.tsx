import React, { useEffect, useMemo, useState } from 'react';
import { useAuth as useClerkAuth } from '@clerk/react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useSocial } from '../context/SocialContext';
import type { CommunityComment, CommunityPost } from '../types';
import {
  Search, Plus, Heart, MessageSquare, Send, X, Users, GitBranch,
  Rocket, HelpCircle, Sparkles, Trophy, UserPlus, UserCheck,
  ArrowUpRight, ChevronRight, Loader2, Reply
} from 'lucide-react';

type View = 'all' | 'discussions' | 'projects' | 'questions' | 'showcase' | 'building';
const categories = ['All', 'Build in Public', 'Questions', 'Projects', 'Hackathons', 'AI', 'Android', 'General'];

const meta = (post: CommunityPost) => `${post.authorRole} · ${post.authorRep} REP`;

const typeFor = (post: CommunityPost) => {
  if (post.category === 'Projects') return { label: 'PROJECT', icon: GitBranch, cls: 'bg-dc-blue' };
  if (post.category === 'Questions') return { label: 'QUESTION', icon: HelpCircle, cls: 'bg-dc-yellow' };
  if (post.category === 'Build in Public') return { label: 'BUILDING', icon: Rocket, cls: 'bg-dc-pink' };
  if (post.category === 'Hackathons') return { label: 'SHOWCASE', icon: Trophy, cls: 'bg-dc-lavender' };
  return { label: post.category.toUpperCase(), icon: Sparkles, cls: 'bg-surface' };
};

export const CommunityRefinedPage: React.FC = () => {
  const { user, posts, commentsByPost, addPost, toggleLikePost, loadPostComments, setActiveTab } = useAuth();
  const { toggleCommentLike } = useNotifications();
  const { openProfile, toggleFollow, requestConnection, loadSocialSummary } = useSocial();
  const { getToken } = useClerkAuth();

  const [view, setView] = useState<View>('all');
  const [query, setQuery] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [postCategory, setPostCategory] = useState<CommunityPost['category']>('Build in Public');
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState('');
  const [commentPost, setCommentPost] = useState<CommunityPost | null>(null);
  const [commentText, setCommentText] = useState('');
  const [commentBusy, setCommentBusy] = useState(false);
  const [replyTargetId, setReplyTargetId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyBusy, setReplyBusy] = useState(false);
  const [socialBusy, setSocialBusy] = useState<string | null>(null);
  const [followed, setFollowed] = useState<Record<string, boolean>>({});
  const [connected, setConnected] = useState<Record<string, boolean>>({});
  const [overview, setOverview] = useState<{ stats: { members: number; posts: number; projects: number; activeToday: number }; popularTags: { tag: string; count: number }[]; topContributors: { id: string; name: string; avatar: string; rep: number; level: number; academicYear: string; college: string; branch: string }[] } | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const response = await fetch('/api/community/overview', { headers: { Authorization: `Bearer ${token}` } });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'Could not load community overview.');
        if (!cancelled) setOverview(data);
      } catch (error) { console.error('Could not load community overview:', error); }
    })();
    return () => { cancelled = true; };
  }, [getToken]);

  useEffect(() => {
    if (!commentPost) return;
    void loadPostComments(commentPost.id);
    setCommentText('');
    setReplyTargetId(null);
    setReplyText('');
  }, [commentPost, loadPostComments]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return posts.filter((post) => {
      const matchesView = view === 'all'
        || (view === 'discussions' && ['General', 'AI', 'Android'].includes(post.category))
        || (view === 'projects' && post.category === 'Projects')
        || (view === 'questions' && post.category === 'Questions')
        || (view === 'showcase' && post.category === 'Hackathons')
        || (view === 'building' && post.category === 'Build in Public');
      if (!matchesView) return false;
      if (!needle) return true;
      return [post.title, post.content, post.authorName, post.authorCollege, post.category]
        .filter(Boolean).join(' ').toLowerCase().includes(needle);
    });
  }, [posts, query, view]);

  const projects = posts.filter((post) => post.category === 'Projects').slice(0, 3);
  const builders = posts.filter((post) => post.category === 'Build in Public').slice(0, 3);
  const people = useMemo(() => {
    const map = new Map<string, CommunityPost>();
    posts.forEach((post) => { if (post.authorId !== user?.id && !map.has(post.authorId)) map.set(post.authorId, post); });
    return Array.from(map.values()).slice(0, 5);
  }, [posts, user?.id]);

  const publish = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || !postContent.trim() || publishing) return;
    setPublishing(true); setPublishError('');
    try {
      await addPost({
        authorName: user.name, authorCollege: user.college, authorAvatar: user.avatar,
        authorRole: user.role, authorRep: user.rep, category: postCategory,
        title: postTitle.trim() || undefined, content: postContent.trim()
      });
      setPostTitle(''); setPostContent(''); setShowCreate(false);
    } catch (error: any) {
      setPublishError(error?.message || 'Could not publish.');
    } finally { setPublishing(false); }
  };

  const socialAction = async (id: string, action: 'follow' | 'connect') => {
    if (!user || socialBusy) return;
    setSocialBusy(id);
    try {
      if (action === 'follow') {
        const summary = await toggleFollow(id);
        setFollowed((prev) => ({ ...prev, [id]: summary.isFollowing }));
      } else {
        const summary = await requestConnection(id);
        setConnected((prev) => ({ ...prev, [id]: summary.connectionStatus === 'connected' || summary.connectionStatus === 'outgoing_pending' }));
      }
    } finally { setSocialBusy(null); }
  };

  const commentSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!commentPost || !commentText.trim() || commentBusy || replyBusy) return;
    setCommentBusy(true);
    try {
      const token = await getToken();
      const base = String(import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
      const response = await fetch(`${base}/functions/v1/community-comments`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: commentPost.id, content: commentText.trim() })
      });
      if (!response.ok) throw new Error('Could not add comment.');
      await loadPostComments(commentPost.id);
      setCommentText('');
    } catch { /* existing community error surfaces remain unchanged */ }
    finally { setCommentBusy(false); }
  };

  const replySubmit = async (parentCommentId: string) => {
    if (!commentPost || !replyText.trim() || replyBusy || commentBusy) return;
    setReplyBusy(true);
    try {
      const token = await getToken();
      const base = String(import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
      const response = await fetch(`${base}/functions/v1/community-comments`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: commentPost.id, parentCommentId, content: replyText.trim() })
      });
      if (!response.ok) throw new Error('Could not add reply.');
      await loadPostComments(commentPost.id);
      setReplyTargetId(null);
      setReplyText('');
    } catch { /* existing community error surfaces remain unchanged */ }
    finally { setReplyBusy(false); }
  };

  const activeComments = commentPost ? commentsByPost[commentPost.id] || [] : [];
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
    const replies = repliesFor.get(comment.id) || [];
    return (
      <div key={comment.id} className={depth > 0 ? 'ml-5 border-l-2 border-outline-variant pl-3' : ''}>
        <div className="border border-outline-variant p-3">
          <div className="flex items-center gap-2">
            {comment.authorAvatar ? <img src={comment.authorAvatar} alt="" className="w-6 h-6 border border-outline-variant object-cover" /> : <div className="w-6 h-6 border border-outline-variant bg-dc-yellow flex items-center justify-center text-[9px] font-bold">{comment.authorName.slice(0,1)}</div>}
            <div><p className="text-[11px] font-bold">{comment.authorName}</p><p className="font-label-mono text-[7px] uppercase text-on-surface-variant">{comment.authorRep} REP</p></div>
          </div>
          <p className="text-xs leading-relaxed mt-2 whitespace-pre-wrap">{comment.content}</p>
          <div className="flex items-center gap-3 mt-2">
            <button onClick={() => void toggleCommentLike(comment.id)} className="font-label-mono text-[8px] uppercase inline-flex items-center gap-1 hover:text-primary"><Heart className="w-3 h-3" fill={comment.likedByMe ? 'currentColor' : 'none'} /> {comment.likes || 0}</button>
            <button type="button" onClick={() => { setReplyTargetId((prev) => prev === comment.id ? null : comment.id); setReplyText(''); }} disabled={replyBusy} className="font-label-mono text-[8px] uppercase inline-flex items-center gap-1 hover:text-primary"><Reply className="w-3 h-3" /> Reply</button>
            {replies.length > 0 && <span className="font-label-mono text-[7px] uppercase text-on-surface-variant">{replies.length} repl{replies.length === 1 ? 'y' : 'ies'}</span>}
          </div>
          {replyTargetId === comment.id && <div className="mt-2 ml-3 flex gap-2"><input value={replyText} onChange={(e) => setReplyText(e.target.value.slice(0, 2000))} placeholder={`Reply to ${comment.authorName}...`} className="flex-1 min-w-0 border border-outline-variant bg-surface p-2 text-xs outline-none" disabled={replyBusy} autoFocus /><button type="button" onClick={() => void replySubmit(comment.id)} disabled={!replyText.trim() || replyBusy} className="px-3 bg-primary text-on-primary border border-outline-variant font-label-mono text-[8px] uppercase font-bold disabled:opacity-50">{replyBusy ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Reply'}</button></div>}
        </div>
        {replies.length > 0 && <div className="mt-2 space-y-2">{replies.map((reply) => renderComment(reply, depth + 1))}</div>}
      </div>
    );
  };

  return (
    <div className="w-full max-w-[1500px] mx-auto space-y-4">
      <header className="border-2 border-outline-variant bg-surface p-4 sm:p-5 dc-hard-shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="min-w-0">
            <div className="font-label-mono text-[9px] uppercase text-primary tracking-widest">04 / COMMUNITY</div>
            <div className="flex items-baseline gap-3 flex-wrap mt-1">
              <h1 className="dc-display text-4xl sm:text-5xl leading-none">BUILD TOGETHER.</h1>
              <span className="font-label-mono text-[9px] uppercase text-on-surface-variant">{posts.length} contributions</span>
            </div>
            <p className="text-sm text-on-surface-variant mt-2 max-w-2xl">A compact space to ask, build, showcase, find collaborators and ship.</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="shrink-0 inline-flex items-center justify-center gap-2 px-4 py-3 bg-primary text-on-primary border-2 border-outline-variant dc-hard-shadow-sm font-label-mono text-[9px] uppercase font-bold">
            <Plus className="w-4 h-4" /> Create post
          </button>
        </div>
        <div className="grid lg:grid-cols-[1fr_auto] gap-3 mt-4">
          <label className="flex items-center gap-2 border-2 border-outline-variant bg-background px-3 h-10">
            <Search className="w-4 h-4 text-on-surface-variant shrink-0" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search people, projects, discussions..." className="bg-transparent outline-none w-full text-sm" />
          </label>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {(['all','discussions','projects','questions','showcase','building'] as View[]).map((item) => (
              <button key={item} onClick={() => setView(item)} className={`px-3 h-10 border-2 border-outline-variant font-label-mono text-[8px] uppercase whitespace-nowrap ${view === item ? 'bg-dc-yellow font-bold' : 'bg-surface hover:bg-dc-blue'}`}>
                {item === 'all' ? 'All' : item}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="grid xl:grid-cols-[minmax(0,1fr)_320px] gap-4 items-start">
        <section className="min-w-0 space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="font-label-mono text-[9px] uppercase tracking-widest">COMMUNITY FEED / {view}</div>
            <span className="font-label-mono text-[9px] text-on-surface-variant">{filtered.length} shown</span>
          </div>

          {filtered.length === 0 && <div className="border-2 border-dashed border-outline-variant p-8 text-center bg-surface"><Users className="w-6 h-6 mx-auto mb-2" /><p className="text-sm font-bold">Nothing here yet.</p><p className="text-xs text-on-surface-variant mt-1">Start the conversation.</p></div>}

          {filtered.map((post) => {
            const t = typeFor(post); const Icon = t.icon;
            return (
              <article key={post.id} className="border-2 border-outline-variant bg-surface hover:translate-x-[2px] hover:shadow-[3px_3px_0_#171717] transition-all">
                <div className="px-4 py-3 border-b border-outline-variant/60 flex items-center justify-between gap-3">
                  <button onClick={() => openProfile(post.authorId)} className="flex items-center gap-2 min-w-0 text-left">
                    {post.authorAvatar ? <img src={post.authorAvatar} alt="" className="w-8 h-8 border border-outline-variant object-cover shrink-0" /> : <div className="w-8 h-8 border border-outline-variant bg-dc-yellow flex items-center justify-center text-xs font-bold shrink-0">{post.authorName.slice(0,1)}</div>}
                    <div className="min-w-0"><p className="text-xs font-bold truncate">{post.authorName}</p><p className="font-label-mono text-[8px] uppercase text-on-surface-variant truncate">{meta(post)}</p></div>
                  </button>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 border border-outline-variant font-label-mono text-[8px] uppercase font-bold shrink-0 ${t.cls}`}><Icon className="w-3 h-3" /> {t.label}</span>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0"><h2 className="text-base font-bold leading-snug">{post.title || post.content.slice(0, 72)}</h2><p className="text-sm leading-relaxed text-on-surface-variant mt-1.5">{post.content}</p></div>
                    <button onClick={() => openProfile(post.authorId)} className="hidden sm:flex shrink-0 p-2 border border-outline-variant hover:bg-dc-blue" aria-label="Open developer"><ArrowUpRight className="w-4 h-4" /></button>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mt-4 pt-3 border-t border-outline-variant/50">
                    <div className="flex items-center gap-1">
                      <button onClick={() => void toggleLikePost(post.id)} className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 border border-outline-variant font-label-mono text-[8px] uppercase ${post.likedByMe ? 'bg-dc-pink font-bold' : 'hover:bg-dc-pink'}`}><Heart className="w-3.5 h-3.5" /> {post.likes}</button>
                      <button onClick={() => setCommentPost(post)} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 border border-outline-variant font-label-mono text-[8px] uppercase hover:bg-dc-blue"><MessageSquare className="w-3.5 h-3.5" /> {post.commentsCount}</button>
                    </div>
                    {post.category === 'Projects' && <span className="font-label-mono text-[8px] uppercase text-on-surface-variant">Open to collaborators</span>}
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        <aside className="space-y-3 xl:sticky xl:top-4">
          <div className="border-2 border-outline-variant bg-surface p-4">
            <div className="flex items-center justify-between mb-3"><p className="font-label-mono text-[9px] uppercase tracking-widest">DISCOVER PEOPLE</p><Users className="w-4 h-4" /></div>
            <div className="space-y-2">
              {people.map((person) => <div key={person.authorId} className="flex items-center gap-2 border border-outline-variant p-2">
                <button onClick={() => openProfile(person.authorId)} className="min-w-0 flex-1 flex items-center gap-2 text-left">
                  {person.authorAvatar ? <img src={person.authorAvatar} alt="" className="w-7 h-7 border border-outline-variant object-cover" /> : <div className="w-7 h-7 bg-dc-yellow border border-outline-variant flex items-center justify-center text-[10px] font-bold">{person.authorName.slice(0,1)}</div>}
                  <div className="min-w-0"><p className="text-[11px] font-bold truncate">{person.authorName}</p><p className="font-label-mono text-[7px] uppercase text-on-surface-variant truncate">{person.authorRole} · {person.authorRep} REP</p></div>
                </button>
                <div className="flex gap-1 shrink-0">
                  <button disabled={socialBusy === person.authorId} onClick={() => void socialAction(person.authorId, 'follow')} className={`p-1.5 border border-outline-variant ${followed[person.authorId] ? 'bg-dc-blue' : 'hover:bg-dc-blue'}`} title="Follow"><UserCheck className="w-3.5 h-3.5" /></button>
                  <button disabled={socialBusy === person.authorId} onClick={() => void socialAction(person.authorId, 'connect')} className={`p-1.5 border border-outline-variant ${connected[person.authorId] ? 'bg-dc-yellow' : 'hover:bg-dc-yellow'}`} title="Connect">{socialBusy === person.authorId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}</button>
                </div>
              </div>)}
              {people.length === 0 && <p className="text-xs text-on-surface-variant">People will appear as the community grows.</p>}
            </div>
          </div>

          <div className="border-2 border-outline-variant bg-surface p-4">
            <div className="flex items-center justify-between mb-3"><p className="font-label-mono text-[9px] uppercase tracking-widest">PROJECTS</p><GitBranch className="w-4 h-4" /></div>
            <div className="space-y-2">
              {projects.map((project) => <button key={project.id} onClick={() => setCommentPost(project)} className="w-full text-left border border-outline-variant p-3 hover:bg-dc-blue"><div className="flex items-center justify-between gap-2"><span className="text-xs font-bold truncate">{project.title || 'Untitled project'}</span><ArrowUpRight className="w-3.5 h-3.5 shrink-0" /></div><p className="text-[11px] text-on-surface-variant mt-1 line-clamp-2">{project.content}</p><div className="font-label-mono text-[7px] uppercase mt-2">{project.authorName} · PROJECT</div></button>)}
              {projects.length === 0 && <p className="text-xs text-on-surface-variant">Create a Projects post to start the project board.</p>}
            </div>
          </div>

          <div className="border-2 border-outline-variant bg-dc-yellow p-4">
            <div className="flex items-center gap-2 mb-2"><Rocket className="w-4 h-4" /><p className="font-label-mono text-[9px] uppercase tracking-widest font-bold">BUILDING NOW</p></div>
            {builders.map((builder) => <button key={builder.id} onClick={() => setCommentPost(builder)} className="w-full text-left border-t border-outline-variant/60 py-2 first:border-t-0"><p className="text-[11px] font-bold truncate">{builder.authorName}</p><p className="text-[10px] leading-snug line-clamp-2">{builder.title || builder.content}</p></button>)}
            {builders.length === 0 && <p className="text-xs">No public builds yet.</p>}
          </div>

          <div className="border-2 border-outline-variant bg-surface p-4"><p className="font-label-mono text-[8px] uppercase text-on-surface-variant">THE LOOP</p><p className="text-sm font-bold mt-1">DISCOVER → TALK → BUILD → COLLAB → SHIP</p><p className="text-[10px] text-on-surface-variant mt-2">Reputation should follow contribution, not noise.</p></div>
        </aside>
      </div>

      {showCreate && <div className="fixed inset-0 z-[110] bg-black/70 backdrop-blur-sm p-3 sm:p-6 flex items-center justify-center"><form onSubmit={publish} className="w-full max-w-2xl bg-background border-2 border-outline-variant shadow-[7px_7px_0_#171717]">
        <header className="flex items-center justify-between p-4 border-b-2 border-outline-variant"><div><p className="font-label-mono text-[8px] uppercase text-primary">COMMUNITY / CREATE</p><h2 className="dc-display text-3xl">MAKE SOMETHING.</h2></div><button type="button" onClick={() => setShowCreate(false)} className="p-2 border border-outline-variant"><X className="w-4 h-4" /></button></header>
        <div className="p-4 space-y-3"><div className="flex flex-wrap gap-1">{categories.map((category) => <button type="button" key={category} onClick={() => category !== 'All' && setPostCategory(category as CommunityPost['category'])} className={`px-2.5 py-1.5 border border-outline-variant font-label-mono text-[8px] uppercase ${postCategory === category ? 'bg-dc-yellow font-bold' : 'hover:bg-dc-blue'}`}>{category}</button>)}</div><input value={postTitle} onChange={(e) => setPostTitle(e.target.value.slice(0, 140))} placeholder="Title (optional)" className="w-full h-10 px-3 border-2 border-outline-variant bg-surface text-sm outline-none" /><textarea value={postContent} onChange={(e) => setPostContent(e.target.value.slice(0, 4000))} placeholder="What are you building, learning, asking or shipping?" rows={7} className="w-full p-3 border-2 border-outline-variant bg-surface text-sm outline-none resize-y" />{publishError && <p className="text-xs text-primary">{publishError}</p>}<div className="flex justify-end"><button disabled={!postContent.trim() || publishing} className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary border-2 border-outline-variant dc-hard-shadow-sm font-label-mono text-[9px] uppercase font-bold">{publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Publish</button></div></div>
      </form></div>}

      {commentPost && <div className="fixed inset-0 z-[115] bg-black/70 backdrop-blur-sm p-3 sm:p-6 flex items-center justify-center"><div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-background border-2 border-outline-variant shadow-[7px_7px_0_#171717]"><header className="sticky top-0 z-10 bg-background flex items-center justify-between p-4 border-b-2 border-outline-variant"><div className="min-w-0"><p className="font-label-mono text-[8px] uppercase text-primary">DISCUSSION</p><h2 className="text-base font-bold truncate">{commentPost.title || 'Community post'}</h2></div><button onClick={() => setCommentPost(null)} className="p-2 border border-outline-variant"><X className="w-4 h-4" /></button></header><div className="p-4 space-y-3"><div className="border-2 border-outline-variant bg-surface p-3"><p className="text-sm leading-relaxed">{commentPost.content}</p><div className="font-label-mono text-[8px] uppercase text-on-surface-variant mt-2">{commentPost.authorName} · {commentPost.authorRep} REP</div></div>{roots.length > 0 ? roots.map((comment) => renderComment(comment)) : <p className="text-xs text-on-surface-variant py-3">No comments yet. Start the discussion.</p>}<form onSubmit={commentSubmit} className="flex gap-2 sticky bottom-0 bg-background pt-2"><input value={commentText} onChange={(e) => setCommentText(e.target.value.slice(0, 2000))} placeholder="Add a useful comment..." className="flex-1 min-w-0 h-10 px-3 border-2 border-outline-variant bg-surface text-sm outline-none" /><button disabled={!commentText.trim() || commentBusy || replyBusy} className="px-3 border-2 border-outline-variant bg-primary text-on-primary"><Send className="w-4 h-4" /></button></form></div></div></div>}
    </div>
  );
};