import React, { useEffect, useState } from 'react';
import { BrainCircuit, Loader2, ShieldCheck } from 'lucide-react';
import type { Mentor } from '../types';

type Match = Mentor & { similarity: number };

export const MentorMatchPanel: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [opened, setOpened] = useState(false);
  const [error, setError] = useState('');

  const findMatches = async () => {
    setOpened(true);
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/mentors/matches');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not find mentor matches.');
      setMatches(data.results || []);
    } catch (err: any) {
      setError(err?.message || 'Could not find mentor matches.');
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!opened) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpened(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [opened]);

  return <>
    <section className="border-2 border-outline-variant bg-dc-lavender p-5 shadow-[4px_4px_0_#171717]">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 border-2 border-outline-variant bg-surface flex items-center justify-center shrink-0">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <p className="font-label-mono text-[10px] uppercase tracking-[0.18em]">AI MENTOR MATCH</p>
            <h3 className="dc-display text-2xl mt-1">FIND YOUR BEST FIT.</h3>
            <p className="text-xs text-on-surface-variant mt-1 max-w-2xl">BGE-M3 compares your skills, interests, goals and background with verified mentor profiles to rank the most relevant matches.</p>
          </div>
        </div>
        <button onClick={findMatches} disabled={loading} className="border-2 border-outline-variant bg-primary text-on-primary px-5 py-3 font-label-mono text-[10px] uppercase font-bold shadow-[3px_3px_0_#171717] disabled:opacity-60 flex items-center justify-center gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
          {loading ? 'MATCHING...' : 'MATCH ME'}
        </button>
      </div>
    </section>

    {opened && <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpened(false); }}>
      <div className="bg-surface border-2 border-outline-variant p-6 max-w-3xl w-full max-h-[85vh] overflow-y-auto shadow-[7px_7px_0_#171717]">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <p className="font-label-mono text-[10px] uppercase text-on-surface-variant">BGE-M3 / SEMANTIC MATCHING</p>
            <h3 className="dc-display text-4xl mt-1">YOUR MATCHES.</h3>
          </div>
          <button onClick={() => setOpened(false)} className="border-2 border-outline-variant px-3 py-2 font-label-mono text-[10px] uppercase">CLOSE</button>
        </div>
        {loading ? <div className="py-12 flex items-center justify-center gap-3 font-label-mono text-xs uppercase"><Loader2 className="w-4 h-4 animate-spin" /> Comparing mentor profiles...</div> : error ? <div className="border-2 border-outline-variant bg-dc-pink p-5 font-label-mono text-xs">{error}</div> : matches.length === 0 ? <div className="border-2 border-dashed border-outline-variant p-10 text-center"><p className="dc-display text-3xl">NO MATCHES YET.</p><p className="text-xs text-on-surface-variant mt-2">Complete your profile with skills, interests and a learning goal to improve matching.</p></div> : <div className="space-y-3">{matches.map((mentor) => <article key={mentor.id} className="border-2 border-outline-variant bg-surface p-4 flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex gap-3 min-w-0">{mentor.avatar ? <img src={mentor.avatar} alt={mentor.name} className="w-12 h-12 border-2 border-outline-variant object-cover shrink-0" /> : <div className="w-12 h-12 border-2 border-outline-variant bg-dc-yellow flex items-center justify-center font-bold shrink-0">{mentor.name.slice(0, 1)}</div>}<div className="min-w-0"><div className="flex items-center gap-2 flex-wrap"><h4 className="font-bold">{mentor.name}</h4>{mentor.roleType === 'SENIOR' && <span className="inline-flex items-center gap-1 border-2 border-outline-variant bg-dc-mint px-2 py-1 font-label-mono text-[8px] uppercase"><ShieldCheck className="w-3 h-3" /> Verified</span>}</div><p className="font-label-mono text-[9px] uppercase text-on-surface-variant">{mentor.title} · {mentor.college || 'College not provided'}</p><p className="text-xs text-on-surface-variant mt-2">{mentor.bio || 'No bio provided.'}</p><div className="flex flex-wrap gap-1.5 mt-2">{mentor.skills.slice(0, 6).map((skill) => <span key={skill} className="bg-dc-mint border-2 border-outline-variant px-1.5 py-0.5 font-label-mono text-[8px] uppercase">{skill}</span>)}</div></div></div>
          <div className="sm:w-24 shrink-0 flex sm:flex-col justify-between sm:justify-center sm:text-right"><span className="font-label-mono text-[9px] uppercase text-on-surface-variant">MATCH</span><strong className="text-2xl">{Math.round(mentor.similarity * 100)}%</strong></div>
        </article>)}</div>}
      </div>
    </div>}
  </>;
};
