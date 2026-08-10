import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  MessageSquare,
  Heart,
  Share2,
  Send,
  Plus,
  Flame,
  CheckCircle2,
  X,
  Code,
  HelpCircle,
  Rocket,
  Users,
} from 'lucide-react';

export const CommunityPage: React.FC = () => {
  const { user, posts, addPost, toggleLikePost } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showNewPostModal, setShowShowNewPostModal] = useState(false);

  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postCategory, setPostCategory] = useState<
    'Build in Public' | 'Questions' | 'Projects' | 'Hackathons' | 'AI' | 'Android' | 'General'
  >('Build in Public');

  const categories = ['All', 'Build in Public', 'Questions', 'Projects', 'Hackathons', 'AI', 'Android'];

  const filteredPosts =
    selectedCategory === 'All' ? posts : posts.filter((p) => p.category === selectedCategory);

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim()) return;

    addPost({
      authorName: user?.name || 'Student Developer',
      authorCollege: user?.college || 'Institute of Technology',
      authorAvatar: user?.avatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuAoACwcivsiMbHH0a_RxINe7Ny_2s2FDDkCw2JWclPgXtJ8fz7Uttp54ejROeQZK800BxfBZ3--Os12blJYDlMW-3NWK3w6pw-IavFJGZ9nVxMmPTgkAfg5mHcurV6LU5BTMYzBBixPeKiSdCMJgGAmP0AkI18uS1NazoB0ZCwNPCYVCwS4NVFKnTGiPHSsp_QLsf6XES7XfY76G_VmAfFQQjmtlNSSkBTCh6uMJBfZSbVZ4q5v_SaYjCBR1p3HFKK6By1AalBNtiM',
      authorRole: user?.role || 'student',
      authorRep: user?.rep || 2500,
      category: postCategory,
      title: postTitle.trim() || undefined,
      content: postContent,
    });

    setPostTitle('');
    setPostContent('');
    setShowShowNewPostModal(false);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="font-headline-lg text-3xl sm:text-4xl font-bold text-white mb-1">
            Community Hub
          </h2>
          <p className="font-body-lg text-on-surface-variant text-base">
            Connect with student developers, share build progress, and ask questions.
          </p>
        </div>

        <button
          onClick={() => setShowShowNewPostModal(true)}
          className="px-6 py-3.5 bg-primary-container text-white font-bold rounded-xl shadow-lg hover:brightness-110 transition-all flex items-center justify-center gap-2 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span>New Post (+25 REP)</span>
        </button>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap gap-2.5">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-full font-label-mono text-xs uppercase font-bold transition-all ${
              selectedCategory === cat
                ? 'bg-primary text-on-primary shadow-sm'
                : 'bg-surface-container border border-outline-variant text-on-surface-variant hover:border-primary'
            }`}
          >
            {cat === 'Build in Public' && <Sparkles className="w-3.5 h-3.5 inline mr-1 text-tertiary" />}
            {cat}
          </button>
        ))}
      </div>

      {/* Build in Public Highlight Sprints */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-tertiary font-label-mono text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-4 h-4" />
          <span>Active Build-in-Public Sprints</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-surface-container border-2 border-outline-variant p-5 rounded-2xl relative overflow-hidden group hover:border-tertiary transition-all">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAL6Omet69mJLcrZS23x68bbMXl9EbuUgbyiyxWbbEIm4MjFccV78onj7MPY161fpmlC2pnx0t95ThZR3WehXfXcetcfpubOH8M2wRizTrhbgLvCnNj1lTgO4uuKBmzPb2zjVpaszIFh5ITZQByW7fxfuvgPk8ffTmS2bpN9xhJuC7mexLQVOZiX21Odq_UVndutY5Deb4N-XXNYM928ucdCt8su4NyGeQXWptaabihg08rURJQOACEdX4E69FjcNXcpyAok4SXL3s"
                  alt="Arjun"
                  className="w-10 h-10 rounded-full border border-tertiary object-cover"
                />
                <div>
                  <h4 className="text-sm font-bold text-white">Arjun K.</h4>
                  <p className="text-[10px] text-tertiary font-label-mono uppercase">
                    Day 12 of Learning MERN Stack
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-tertiary flex items-center gap-1">
                <Flame className="w-4 h-4 fill-tertiary" /> 12 Days
              </span>
            </div>

            <div className="bg-background rounded-xl p-3 border border-outline-variant/30 text-xs space-y-2">
              <div className="flex justify-between text-[10px] font-label-mono uppercase text-outline">
                <span>Milestone Progress</span>
                <span className="text-tertiary">65% Complete</span>
              </div>
              <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                <div className="bg-tertiary h-full rounded-full w-[65%]" />
              </div>
              <ul className="space-y-1 text-on-surface-variant pt-1 text-[11px]">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-tertiary" />
                  <span>Built JWT Auth & Protected API Routes</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-tertiary" />
                  <span>Integrated Redux Toolkit State Engine</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-surface-container border-2 border-outline-variant p-5 rounded-2xl relative overflow-hidden group hover:border-tertiary transition-all">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAbDkLhdG_KtghqYYi7WxqqTvzM6j_QWR4K1lEGkFsnWQ1FlCN9xrLTL57FDRr5ysKQYrWS8C9t19JJrNqE4oFI0LkLi8hFR8LmcI5gpx5DdTwDFZ4if0ZHbxT6SxCxJW_iPRCHuXEZB7rasT9n-HpLdj4WSJW1RqNIfu6akMjrpTFMPWKDKsDZ9DV-8BKln_2be3YU61I1-E-NZh1P4PrVk6i6bnD4t2uQDpiZZK5hZumF-fLLMqFUcFEd-Wuuys-U2ex9kkP6JaE"
                  alt="Sarah"
                  className="w-10 h-10 rounded-full border border-tertiary object-cover"
                />
                <div>
                  <h4 className="text-sm font-bold text-white">Sarah Chen</h4>
                  <p className="text-[10px] text-tertiary font-label-mono uppercase">
                    Mastering Three.js 3D WebGL Shaders
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-tertiary flex items-center gap-1">
                <Flame className="w-4 h-4 fill-tertiary" /> 24 Days
              </span>
            </div>

            <div className="bg-background rounded-xl p-3 border border-outline-variant/30 text-xs space-y-2">
              <div className="flex justify-between text-[10px] font-label-mono uppercase text-outline">
                <span>Milestone Progress</span>
                <span className="text-tertiary">80% Complete</span>
              </div>
              <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                <div className="bg-tertiary h-full rounded-full w-[80%]" />
              </div>
              <ul className="space-y-1 text-on-surface-variant pt-1 text-[11px]">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-tertiary" />
                  <span>Custom GLSL Fragment Shader Integration</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Main Feed */}
      <section className="space-y-6">
        <h3 className="font-headline-md text-xl font-bold text-white">
          {selectedCategory} Posts ({filteredPosts.length})
        </h3>

        <div className="space-y-6">
          {filteredPosts.map((post) => (
            <div
              key={post.id}
              className="bg-surface border-2 border-outline-variant rounded-2xl p-6 sm:p-8 hover:border-secondary transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <img
                    src={post.authorAvatar}
                    alt={post.authorName}
                    className="w-11 h-11 rounded-full border-2 border-secondary/30 object-cover"
                  />
                  <div>
                    <h5 className="text-white text-base font-bold">{post.authorName}</h5>
                    <p className="text-xs font-label-mono text-outline uppercase">
                      {post.authorCollege} • {post.createdAt}
                    </p>
                  </div>
                </div>
                <span className="bg-primary/10 border border-primary/20 text-primary px-3 py-1 rounded-full text-xs font-label-mono uppercase">
                  {post.category}
                </span>
              </div>

              {post.title && <h4 className="text-lg font-bold text-white mb-2">{post.title}</h4>}
              <p className="text-on-surface-variant text-sm leading-relaxed mb-4">{post.content}</p>

              {post.imageUrl && (
                <div className="rounded-xl overflow-hidden mb-4 max-h-80 bg-surface-container-lowest border border-outline-variant/30">
                  <img src={post.imageUrl} alt="Post content" className="w-full h-full object-cover" />
                </div>
              )}

              <div className="flex items-center gap-6 pt-4 border-t border-outline-variant/20 text-xs font-label-mono text-on-surface-variant">
                <button
                  onClick={() => toggleLikePost(post.id)}
                  className={`flex items-center gap-2 hover:text-error transition-colors ${
                    post.likedByMe ? 'text-error font-bold' : ''
                  }`}
                >
                  <Heart className={`w-4 h-4 ${post.likedByMe ? 'fill-error' : ''}`} />
                  <span>{post.likes}</span>
                </button>
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  <span>{post.commentsCount} Comments</span>
                </div>
                <button className="flex items-center gap-2 ml-auto hover:text-white">
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* New Post Modal */}
      {showNewPostModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <div className="bg-surface-container border-2 border-outline-variant rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setShowShowNewPostModal(false)}
              className="absolute top-4 right-4 text-outline hover:text-white p-2 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-headline-md text-2xl font-bold text-white mb-4">
              Share with Community
            </h3>

            <form onSubmit={handleCreatePost} className="space-y-4">
              <div className="space-y-1">
                <label className="font-label-mono text-xs uppercase text-outline">Category</label>
                <select
                  value={postCategory}
                  onChange={(e) => setPostCategory(e.target.value as any)}
                  className="w-full bg-surface-container-lowest border-2 border-outline-variant rounded-xl p-3 font-body-md text-white text-sm focus:border-secondary outline-none"
                >
                  <option value="Build in Public">Build in Public</option>
                  <option value="Questions">Questions</option>
                  <option value="Projects">Projects</option>
                  <option value="Hackathons">Hackathons</option>
                  <option value="AI">AI</option>
                  <option value="Android">Android</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-label-mono text-xs uppercase text-outline">
                  Title (Optional)
                </label>
                <input
                  type="text"
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  placeholder="e.g. Just shipped my AI project!"
                  className="w-full bg-surface-container-lowest border-2 border-outline-variant rounded-xl p-3 font-body-md text-white text-sm focus:border-secondary outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-label-mono text-xs uppercase text-outline">
                  Post Content
                </label>
                <textarea
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  rows={4}
                  placeholder="Share details, code snippets, or project milestones..."
                  className="w-full bg-surface-container-lowest border-2 border-outline-variant rounded-xl p-3 font-body-md text-white text-sm focus:border-secondary outline-none resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-primary-container text-white font-bold rounded-xl hover:brightness-110 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <Send className="w-4 h-4" />
                <span>Publish Post (+25 REP)</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
