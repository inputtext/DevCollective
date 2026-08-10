import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Flame,
  Zap,
  Award,
  ArrowRight,
  CheckCircle2,
  Circle,
  Play,
  Trophy,
  Heart,
  MessageSquare,
  Share2,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user, tasks, toggleTaskCompletion, leaderboard, posts, toggleLikePost, setActiveTab } = useAuth();

  const completedTasksCount = tasks.filter((t) => t.completed).length;

  return (
    <div className="space-y-10 pb-16">
      {/* Welcome Hero */}
      <section className="py-2">
        <div className="flex flex-col gap-2">
          <p className="font-label-mono text-secondary text-sm font-bold tracking-wide italic">
            "Consistency beats intensity."
          </p>
          <h2 className="font-display-2xl text-4xl sm:text-5xl font-black text-white tracking-tight leading-none">
            Good Morning, {user ? user.name.split(' ')[0] : 'Developer'}
          </h2>
          <div className="mt-4 flex items-center gap-3 bg-primary/10 border border-primary/20 p-4 rounded-xl w-fit">
            <Zap className="w-5 h-5 text-primary" />
            <p className="text-sm font-medium text-on-surface-variant">
              Welcome back! You're only{' '}
              <span className="text-primary font-bold">
                {user ? 3000 - user.rep : 550} REP
              </span>{' '}
              away from reaching Level {user ? user.level + 1 : 19}.
            </p>
          </div>
        </div>
      </section>

      {/* Metrics Row */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* REP Status */}
        <div className="lg:col-span-2 bg-surface border-2 border-outline-variant p-6 rounded-2xl relative overflow-hidden group hover:border-primary transition-all">
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="text-[11px] font-label-mono text-outline uppercase tracking-wider block mb-1">
                Reputation Status
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-white">
                  {user ? user.rep.toLocaleString() : '2,450'}
                </span>
                <span className="text-primary font-label-mono text-sm font-bold">/ 3,000 REP</span>
              </div>
            </div>
            <Award className="w-10 h-10 text-primary opacity-80 group-hover:rotate-12 transition-transform" />
          </div>

          <div>
            <div className="w-full h-3 bg-surface-container-highest rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-1000"
                style={{ width: `${Math.min(100, ((user?.rep || 2450) / 3000) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-xs font-label-mono uppercase">
              <span className="text-outline">Level {user?.level || 18}</span>
              <span className="text-primary font-bold">Next: Level {(user?.level || 18) + 1}</span>
            </div>
          </div>
        </div>

        {/* Streak */}
        <div className="bg-surface border-2 border-outline-variant p-6 rounded-2xl flex flex-col justify-between hover:border-error transition-all">
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 bg-error/10 rounded-xl flex items-center justify-center">
              <Flame className="w-7 h-7 text-error fill-error animate-pulse" />
            </div>
            <span className="text-[11px] font-label-mono text-outline uppercase">Daily Streak</span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-white">
              {user?.streakDays || 42} <span className="text-sm font-normal text-outline">Days</span>
            </div>
            <p className="text-xs font-label-mono text-tertiary uppercase font-bold mt-1">
              Next Reward: +100 REP
            </p>
          </div>
        </div>

        {/* Achievements */}
        <div className="bg-surface border-2 border-outline-variant p-6 rounded-2xl flex flex-col justify-between hover:border-tertiary transition-all">
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 bg-tertiary/10 rounded-xl flex items-center justify-center text-tertiary">
              <Trophy className="w-7 h-7" />
            </div>
            <span className="text-[11px] font-label-mono text-outline uppercase">Achievements</span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-white">
              12 <span class="text-sm font-normal text-outline">Badges</span>
            </div>
            <p className="text-xs font-label-mono text-secondary uppercase font-bold mt-1">
              Top 1% Developer
            </p>
          </div>
        </div>
      </section>

      {/* Centerpiece "Active Mission" */}
      <section>
        <div className="bg-surface-container border-2 border-outline-variant rounded-2xl p-8 relative overflow-hidden group">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-primary/10 border border-primary/30 text-primary rounded-full font-label-mono text-[11px] uppercase tracking-wider">
                <Zap className="w-3.5 h-3.5" />
                <span>Active Mission</span>
              </div>

              <h3 className="font-headline-lg text-3xl font-black text-white leading-tight">
                Artificial Intelligence & Machine Learning
              </h3>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="font-label-mono text-outline uppercase">Roadmap Track</span>
                  <p className="text-white font-bold">AI Beginner Roadmap</p>
                </div>
                <div className="space-y-1">
                  <span className="font-label-mono text-outline uppercase">Current Lesson</span>
                  <p className="text-white font-bold">Neural Networks 101</p>
                </div>
                <div className="space-y-1">
                  <span className="font-label-mono text-outline uppercase">Est. Time</span>
                  <p className="text-white font-bold">20m Remaining</p>
                </div>
                <div className="space-y-1">
                  <span className="font-label-mono text-outline uppercase">Completion Reward</span>
                  <p className="text-tertiary font-bold">+50 REP</p>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('roadmap')}
                className="bg-primary text-on-primary px-8 py-4 rounded-xl font-bold brutalist-shadow transition-all flex items-center gap-3 hover:scale-105 active:scale-95"
              >
                <span>CONTINUE LEARNING</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            <div
              onClick={() => setActiveTab('roadmap')}
              className="relative group cursor-pointer aspect-video rounded-xl border-2 border-outline-variant overflow-hidden bg-surface-container-lowest"
            >
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBFc9BnSHHvbBdL9P-dd_D1AG53lLPRk2sO0b0v9ls2aHtrM2CVq9CQyibrrj75pdam1Px6oBYzoug07s-aEdiurKxdbV35tEZHC-Dmzgn6RwdFu-Sk8QPm67NJazGHkiXG0arwoBn6Hga2nICr-IbxIiJy0uZF1ri6nAAXZ7_cQ_1lGgQSPC-9Tntp87tx7xO1V6NgDH2BTnt_wtBnBhD5JaZk_u6LcaEkDt_Cio-Qrbg3ynh09xwLeLlXQNo1vHeI09190clSV7g"
                alt="Neural Network Visualization"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 bg-primary/20 backdrop-blur-xl border-2 border-primary/50 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Play className="w-8 h-8 text-white fill-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Two Column Section */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Tasks Checklist */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-end justify-between">
            <div>
              <h4 className="font-headline-md text-2xl font-bold text-white">Today's Tasks</h4>
              <p className="text-on-surface-variant text-sm mt-0.5">
                Complete your daily set to earn bonus streak REP.
              </p>
            </div>
            <div className="text-right">
              <span className="font-label-mono text-primary text-xs font-bold uppercase tracking-wider block">
                {completedTasksCount} / {tasks.length} Completed
              </span>
              <div className="w-36 h-2 bg-surface-container-highest rounded-full mt-1.5 overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${(completedTasksCount / tasks.length) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                onClick={() => toggleTaskCompletion(task.id)}
                className={`flex items-center justify-between p-5 border-2 rounded-2xl transition-all cursor-pointer ${
                  task.completed
                    ? 'bg-surface-container-low border-outline-variant/30 opacity-65'
                    : 'bg-surface border-outline-variant hover:border-primary'
                }`}
              >
                <div className="flex items-center gap-4">
                  {task.completed ? (
                    <CheckCircle2 className="w-6 h-6 text-tertiary fill-tertiary/20" />
                  ) : (
                    <Circle className="w-6 h-6 text-outline hover:text-primary" />
                  )}
                  <span
                    className={`text-sm font-medium ${
                      task.completed ? 'line-through text-on-surface-variant' : 'text-white'
                    }`}
                  >
                    {task.title}
                  </span>
                </div>

                <div className="flex items-center gap-4 font-label-mono text-xs uppercase">
                  <span className="text-outline">{task.estimatedMinutes}m</span>
                  <span className="text-primary font-bold">+{task.repReward} REP</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Leaderboard Standings Snippet */}
        <div className="space-y-6">
          <div className="bg-surface-container rounded-2xl border-2 border-outline-variant p-6">
            <div className="flex items-center justify-between mb-6">
              <h4 className="font-label-mono text-xs uppercase text-outline font-bold tracking-widest">
                Leaderboard Standings
              </h4>
              <Trophy className="w-5 h-5 text-primary" />
            </div>

            <div className="space-y-4">
              {leaderboard.slice(0, 4).map((entry) => (
                <div
                  key={entry.id}
                  className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                    entry.isUser
                      ? 'bg-primary/10 border-2 border-primary/40'
                      : 'hover:bg-surface-container-highest/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-5 font-black text-sm text-outline italic">
                      #{entry.rank}
                    </span>
                    <img
                      src={entry.avatar}
                      alt={entry.name}
                      className="w-10 h-10 rounded-full border border-primary object-cover"
                    />
                    <div>
                      <span className="text-sm font-bold text-white block">{entry.name}</span>
                      <span className="text-[10px] font-label-mono text-outline uppercase">
                        {entry.college}
                      </span>
                    </div>
                  </div>
                  <span className="font-label-mono text-xs font-bold text-primary">
                    {entry.rep.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setActiveTab('leaderboard')}
              className="w-full mt-6 py-3 text-primary font-label-mono text-xs font-bold uppercase border-t border-outline-variant hover:underline"
            >
              View Full Standings
            </button>
          </div>
        </div>
      </section>

      {/* Community Activity Feed Snippet */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h4 className="font-headline-md text-2xl font-bold text-white">Community Activity</h4>
          <button
            onClick={() => setActiveTab('community')}
            className="text-primary font-label-mono text-xs uppercase hover:underline"
          >
            View All Community Feed
          </button>
        </div>

        <div className="space-y-6">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-surface border-2 border-outline-variant rounded-2xl p-6 sm:p-8 hover:border-secondary transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <img
                    src={post.authorAvatar}
                    alt={post.authorName}
                    className="w-12 h-12 rounded-full border-2 border-secondary/30 object-cover"
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
    </div>
  );
};
