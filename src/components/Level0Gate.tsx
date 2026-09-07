import React, { useEffect, useState } from 'react';
import { ArrowRight, BookOpen, LockKeyhole, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Level0Gate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, setActiveTab, activeTab } = useAuth();
  const [loading, setLoading] = useState(true);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadProgress = async () => {
      if (!user) {
        setComplete(false);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const token = localStorage.getItem('devcollective_token');
        if (!token) {
          setComplete(false);
          return;
        }

        const response = await fetch('/api/learning/level-0', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          setComplete(false);
          return;
        }

        const data = await response.json();
        const levelProgress = data.levelProgress;
        const isComplete = Boolean(levelProgress?.completed_at || levelProgress?.completedAt);

        if (!cancelled) setComplete(isComplete);
      } catch (error) {
        console.error('Failed to load Level 0 gate state:', error);
        if (!cancelled) setComplete(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadProgress();
    return () => {
      cancelled = true;
    };
  }, [user, activeTab]);

  if (loading || !user || complete || activeTab === 'level-0') return <>{children}</>;

  return (
    <div className="fixed inset-0 z-40 bg-background/95 backdrop-blur-md flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-surface-container border-2 border-primary/30 rounded-3xl p-7 sm:p-9 shadow-2xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-[10px] font-label-mono font-bold uppercase">
          <LockKeyhole className="w-3.5 h-3.5" /> Level 0 Required
        </div>
        <div className="flex items-start gap-4 mt-5">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <BookOpen className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-white">Complete your CSE foundation first.</h2>
            <p className="text-sm text-on-surface-variant mt-2 leading-relaxed">
              Level 0 is mandatory for every student. Finish all six foundation modules before continuing to specialization and later progression.
            </p>
          </div>
        </div>
        <div className="mt-7 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-surface border border-outline-variant"><div className="text-2xl font-black text-white">6</div><div className="text-[10px] font-label-mono uppercase text-outline mt-1">Modules</div></div>
          <div className="p-4 rounded-2xl bg-surface border border-outline-variant"><div className="text-2xl font-black text-white">∞</div><div className="text-[10px] font-label-mono uppercase text-outline mt-1">Practice</div></div>
          <div className="p-4 rounded-2xl bg-surface border border-outline-variant"><div className="text-2xl font-black text-primary">✓</div><div className="text-[10px] font-label-mono uppercase text-outline mt-1">Verified checkpoints</div></div>
        </div>
        <button type="button" onClick={() => setActiveTab('level-0')} className="mt-7 w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-bold uppercase text-sm font-label-mono">
          Enter Level 0 <ArrowRight className="w-5 h-5" />
        </button>
        <div className="mt-4 flex items-center justify-center gap-2 text-[10px] uppercase font-label-mono text-outline"><ShieldCheck className="w-3.5 h-3.5" /> Your access state is re-evaluated from stored progress</div>
      </div>
    </div>
  );
};
