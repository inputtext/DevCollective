import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, CheckCircle2, Circle, Flame, Map, Trophy, UserRound, Users, Zap } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user, tasks, toggleTaskCompletion, leaderboard, setActiveTab, completeOnboarding, repAnimation } = useAuth();
  if (!user) return null;

  const completedTasksCount = tasks.filter((task) => task.completed).length;
  const taskProgress = tasks.length ? Math.round((completedTasksCount / tasks.length) * 100) : 0;
  const firstName = user.name.split(' ')[0].toUpperCase();
  const selectedPathCount = user.selectedDomains?.length || 0;
  const visibleLeaderboard = leaderboard.slice(0, 5);

  const stats = [
    { label: 'REP', value: user.rep.toLocaleString(), note: 'TOTAL REPUTATION', tone: 'blue' },
    { label: 'LEVEL', value: String(user.level), note: 'CURRENT LEVEL', tone: 'lavender' },
    { label: 'STREAK', value: `${user.streakDays}d`, note: 'CURRENT STREAK', tone: 'mint' },
    { label: 'TASKS', value: `${completedTasksCount}/${tasks.length}`, note: 'TASK PROGRESS', tone: 'yellow' },
  ];

  const quickActions = [
    { title: 'Roadmaps', meta: 'BUILD YOUR NEXT STEP', icon: Map, target: 'roadmap' as const },
    { title: 'Community', meta: 'SEE WHAT PEOPLE SHIP', icon: Users, target: 'community' as const },
    { title: 'Profile', meta: 'KEEP YOUR SIGNAL FRESH', icon: UserRound, target: 'profile' as const },
  ];

  return (
    <div className="space-y-7 pb-16 relative">
      {user.hasCompletedOnboarding === false && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <div className="bg-surface border-2 border-outline-variant p-8 max-w-lg w-full shadow-[7px_7px_0_#171717] space-y-6">
            <p className="font-label-mono text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">SESSION / INITIALIZED</p>
            <h3 className="dc-display text-5xl">WELCOME, {firstName}.</h3>
            <p className="text-sm text-on-surface-variant leading-relaxed">Your DevCollective workspace is empty by design. Build your profile, choose a path, and start creating your own activity.</p>
            <div className="grid grid-cols-3 border-2 border-outline-variant">
              <div className="p-4 border-r-2 border-outline-variant"><span className="font-label-mono text-[9px] uppercase text-on-surface-variant block">REP</span><strong className="dc-display text-2xl block mt-1">0</strong></div>
              <div className="p-4 border-r-2 border-outline-variant"><span className="font-label-mono text-[9px] uppercase text-on-surface-variant block">LEVEL</span><strong className="dc-display text-2xl block mt-1">1</strong></div>
              <div className="p-4"><span className="font-label-mono text-[9px] uppercase text-on-surface-variant block">STREAK</span><strong className="dc-display text-2xl block mt-1">0</strong></div>
            </div>
            <button onClick={() => completeOnboarding()} className="w-full bg-primary text-on-primary border-2 border-outline-variant shadow-[4px_4px_0_#171717] py-4 font-label-mono text-xs uppercase font-bold flex items-center justify-center gap-2">ENTER WORKSPACE <ArrowRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {repAnimation && <div key={repAnimation.id} className="dc-dashboard-rep-toast">+{repAnimation.amount} REP EARNED</div>}

      <section className="dc-dashboard-hero" data-gsap-reveal>
        <div className="relative z-10">
          <p className="dc-dashboard-kicker">Workspace / Personal Command Center</p>
          <h2 className="dc-dashboard-title mt-4">GOOD TO SEE YOU,<br /><span className="accent">{firstName}.</span></h2>
          <p className="dc-dashboard-copy">A focused snapshot of your learning progress, reputation, and what to do next. Your workspace gets richer as you actually use it.</p>
          <div className="dc-dashboard-hero-actions">
            <button onClick={() => setActiveTab('roadmap')} className="dc-dashboard-action"><Map className="w-4 h-4" /> Explore roadmap <ArrowRight className="w-3.5 h-3.5" /></button>
            <button onClick={() => setActiveTab('profile')} className="dc-dashboard-action secondary"><UserRound className="w-4 h-4" /> Edit profile</button>
          </div>
        </div>

        <aside className="dc-dashboard-snapshot">
          <div className="dc-dashboard-snapshot-top">
            {user.avatar ? <img src={user.avatar} alt={user.name} className="dc-dashboard-avatar" /> : <div className="dc-dashboard-avatar dc-dashboard-avatar-fallback">{user.name.slice(0, 1).toUpperCase()}</div>}
            <div className="min-w-0">
              <p className="dc-dashboard-snapshot-name truncate">{user.name}</p>
              <p className="dc-dashboard-snapshot-role">{user.role} · level {user.level}</p>
            </div>
          </div>
          <div className="dc-dashboard-meta">
            <div className="dc-dashboard-meta-item"><p className="dc-dashboard-meta-label">COLLEGE</p><p className="dc-dashboard-meta-value" title={user.college || 'Not set'}>{user.college || 'Not set'}</p></div>
            <div className="dc-dashboard-meta-item"><p className="dc-dashboard-meta-label">PATHS</p><p className="dc-dashboard-meta-value">{selectedPathCount} selected</p></div>
            <div className="dc-dashboard-meta-item"><p className="dc-dashboard-meta-label">BRANCH</p><p className="dc-dashboard-meta-value" title={user.branch || 'Not set'}>{user.branch || 'Not set'}</p></div>
            <div className="dc-dashboard-meta-item"><p className="dc-dashboard-meta-label">IDENTITY</p><p className="dc-dashboard-meta-value">{user.email}</p></div>
          </div>
        </aside>
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4" data-gsap-reveal>
        {stats.map((stat) => (
          <div key={stat.label} className={`dc-dashboard-stat ${stat.tone}`}>
            <span className="dc-dashboard-stat-label">{stat.label}</span>
            <span className="dc-dashboard-stat-value">{stat.value}{stat.label === 'STREAK' && <Flame className="w-5 h-5" />}</span>
            <span className="dc-dashboard-stat-note">{stat.note}</span>
            {stat.label === 'TASKS' && (
              <div className="dc-dashboard-progress-wrap">
                <div className="dc-dashboard-progress-head"><span>Completion</span><strong>{taskProgress}%</strong></div>
                <div className="dc-dashboard-progress-rail"><div className="dc-dashboard-progress-fill" style={{ width: `${taskProgress}%` }} /></div>
              </div>
            )}
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-[1.45fr_.75fr] gap-6" data-gsap-reveal>
        <div className="border-2 border-outline-variant bg-surface p-6 md:p-8 shadow-[5px_5px_0_#171717]">
          <div className="dc-dashboard-section-heading">
            <div><p className="dc-dashboard-section-label">Learning / Live</p><h3 className="dc-dashboard-section-title">TODAY'S TASKS</h3></div>
            <span className="font-label-mono text-[9px] uppercase text-on-surface-variant">{completedTasksCount}/{tasks.length} COMPLETE</span>
          </div>
          {tasks.length === 0 ? (
            <div className="border-2 border-dashed border-outline-variant p-8 text-center">
              <Zap className="w-6 h-6 mx-auto mb-3 text-primary" />
              <p className="font-label-mono text-xs uppercase font-bold">NO TASKS YET</p>
              <p className="text-xs text-on-surface-variant mt-2 max-w-sm mx-auto">Your learning tasks will appear here when a roadmap assigns them.</p>
              <button onClick={() => setActiveTab('roadmap')} className="mt-5 border-2 border-outline-variant bg-dc-mint px-4 py-3 font-label-mono text-[10px] uppercase font-bold shadow-[3px_3px_0_#171717] inline-flex items-center gap-2">EXPLORE ROADMAPS <ArrowRight className="w-3 h-3" /></button>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <button key={task.id} onClick={() => toggleTaskCompletion(task.id)} className={`dc-dashboard-task-row ${task.completed ? 'completed' : ''}`}>
                  <span className="dc-dashboard-task-main">
                    {task.completed ? <CheckCircle2 className="dc-dashboard-task-icon text-dc-mint" /> : <Circle className="dc-dashboard-task-icon" />}
                    <span className={task.completed ? 'line-through decoration-2 opacity-70' : ''}>{task.title}</span>
                  </span>
                  <span className="dc-dashboard-task-rep">+{task.repReward} REP</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="border-2 border-outline-variant bg-surface p-6 md:p-8 shadow-[5px_5px_0_#171717]">
          <div className="dc-dashboard-section-heading">
            <div><p className="dc-dashboard-section-label">Ranking / Live</p><h3 className="dc-dashboard-section-title">LEADERBOARD</h3></div>
            <Trophy className="w-5 h-5 text-dc-yellow" />
          </div>
          {visibleLeaderboard.length === 0 ? (
            <div className="border-2 border-dashed border-outline-variant p-6 text-center">
              <p className="font-label-mono text-xs uppercase font-bold">NO RANKINGS YET</p>
              <p className="text-xs text-on-surface-variant mt-2">Rankings will populate when real community activity exists.</p>
            </div>
          ) : (
            <div>
              {visibleLeaderboard.map((entry) => (
                <div key={entry.id} className={`dc-dashboard-rank-row ${entry.isUser ? 'current' : ''}`}>
                  <span className="dc-dashboard-rank-chip">{entry.rank}</span>
                  <div className="dc-dashboard-rank-avatar-wrap">
                    {entry.avatar ? <img src={entry.avatar} alt="" className="dc-dashboard-rank-avatar" /> : <span className="dc-dashboard-rank-avatar grid place-items-center text-xs font-bold">{entry.name.slice(0, 1).toUpperCase()}</span>}
                    <div className="min-w-0"><p className="dc-dashboard-rank-name">{entry.name}{entry.isUser && <span className="ml-2 text-[8px] uppercase text-primary">YOU</span>}</p><p className="dc-dashboard-rank-sub">{entry.college || 'College not set'} · {entry.branch || 'Branch not set'}</p></div>
                  </div>
                  <span className="dc-dashboard-rank-rep">{entry.rep.toLocaleString()} REP</span>
                </div>
              ))}
            </div>
          )}
          <button onClick={() => setActiveTab('leaderboard')} className="w-full mt-5 border-2 border-outline-variant py-3 font-label-mono text-[10px] uppercase font-bold inline-flex items-center justify-center gap-2">VIEW FULL RANKINGS <ArrowRight className="w-3 h-3" /></button>
        </div>
      </section>

      <section data-gsap-reveal>
        <div className="dc-dashboard-section-heading">
          <div><p className="dc-dashboard-section-label">Navigation / Shortcuts</p><h3 className="dc-dashboard-section-title">QUICK ACTIONS</h3></div>
          <span className="font-label-mono text-[9px] uppercase text-on-surface-variant">3 entry points</span>
        </div>
        <div className="dc-dashboard-quick-grid">
          {quickActions.map(({ title, meta, icon: Icon, target }) => (
            <button key={title} onClick={() => setActiveTab(target)} className="dc-dashboard-quick text-left">
              <span className="dc-dashboard-quick-icon"><Icon className="w-4 h-4" /></span>
              <span className="dc-dashboard-quick-title">{title}</span>
              <span className="dc-dashboard-quick-meta"><span>{meta}</span><ArrowRight className="w-3.5 h-3.5" /></span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};
