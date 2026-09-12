import React, { useEffect, useState } from 'react';
import { Brain, Clock, RefreshCw, Target } from 'lucide-react';

interface PlanItem { order: number; title: string; type: string; status: string; estimatedHours: number; reason: string; }
interface ResponseData { target: { role: string; goal: string }; user: { level: number; rep: number; skills: string[]; domains: string[] }; progress: { completedSubmodules: number }; plan: PlanItem[]; }

export const AdaptiveLearningPath: React.FC<{ role?: string; goal?: string }> = ({ role, goal }) => {
  const [data, setData] = useState<ResponseData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const qs = new URLSearchParams(); if (role) qs.set('role', role); if (goal) qs.set('goal', goal);
      const r = await fetch(`/api/learning/adaptive-path?${qs.toString()}`); const body = await r.json();
      if (!r.ok || !body.success) throw new Error(body.error || 'Could not load adaptive learning path.');
      setData(body);
    } catch (e: any) { setError(e?.message || 'Could not load adaptive learning path.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);

  return (
    <section className="border-2 border-outline-variant bg-surface dc-hard-shadow p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 font-label-mono text-[10px] uppercase tracking-widest"><Brain size={14} /> Adaptive Learning</div>
          <h2 className="dc-display text-3xl sm:text-4xl mt-2">YOUR NEXT MOVES.</h2>
          <p className="text-sm text-on-surface-variant mt-2">The path adapts to your current level, skills, domains and completed learning checkpoints.</p>
        </div>
        <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 border-2 border-outline-variant bg-background px-3 py-2 font-label-mono text-[10px] uppercase font-bold disabled:opacity-50"><RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh</button>
      </div>
      {error && <div className="mt-4 border-2 border-outline-variant bg-dc-pink p-3 text-sm">{error}</div>}
      {data && <>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          <div className="border-2 border-outline-variant p-3"><div className="font-label-mono text-[9px]">LEVEL</div><strong className="text-2xl">{data.user.level}</strong></div>
          <div className="border-2 border-outline-variant p-3"><div className="font-label-mono text-[9px]">REP</div><strong className="text-2xl">{data.user.rep}</strong></div>
          <div className="border-2 border-outline-variant p-3"><div className="font-label-mono text-[9px]">SKILLS</div><strong className="text-2xl">{data.user.skills.length}</strong></div>
          <div className="border-2 border-outline-variant p-3"><div className="font-label-mono text-[9px]">CHECKPOINTS</div><strong className="text-2xl">{data.progress.completedSubmodules}</strong></div>
        </div>
        <div className="mt-5 space-y-3">
          {data.plan.map((item) => <div key={item.order} className="border-2 border-outline-variant bg-background p-4 flex gap-4">
            <div className="w-9 h-9 shrink-0 border-2 border-outline-variant bg-dc-mint flex items-center justify-center font-bold">{item.order}</div>
            <div className="min-w-0 flex-1"><div className="flex flex-wrap gap-2 items-center"><h3 className="font-bold">{item.title}</h3><span className="font-label-mono text-[9px] uppercase">{item.type}</span></div><p className="text-sm text-on-surface-variant mt-1">{item.reason}</p><span className="inline-flex items-center gap-1 font-label-mono text-[9px] uppercase mt-2"><Clock size={11} /> {item.estimatedHours}h</span></div>
          </div>)}
        </div>
        <div className="mt-5 flex items-center gap-2 text-xs text-on-surface-variant"><Target size={14} /> Target: <strong>{data.target.role}</strong> — {data.target.goal}</div>
      </>}
    </section>
  );
};
