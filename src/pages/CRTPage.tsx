import React, { useMemo } from 'react';
import { Briefcase, Brain, Users, Code2, Video, CheckCircle2, Circle, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { loadJson } from '../lib/aiClient';

// Scaffold for the CRT (Campus Recruitment Training) section. The inner modules are added later.
const MODULES = [
  { icon: Brain, title: 'Aptitude Test', desc: 'Timed quantitative, logical and verbal rounds with tab-switch detection so results are honest.' },
  { icon: Users, title: 'HR Round Practice', desc: 'Common HR questions with AI feedback on your answers and how you present yourself.' },
  { icon: Code2, title: 'Technical Interview', desc: 'Domain questions picked from your roadmap, scored by AI with hints on what you missed.' },
  { icon: Video, title: 'Camera Mock Interview', desc: 'Webcam based practice: eye contact and posture tracking plus speech to text, ending with a report card.' },
];

export const CRTPage: React.FC = () => {
  const { user } = useAuth();
  const checks = useMemo(() => {
    const uid = user?.id || null;
    return [
      { label: 'Profile completed', done: !!(user as any)?.hasCompletedOnboarding },
      { label: 'Roadmap generated', done: !!loadJson<any>(uid ? `devcollective_ai_roadmap_${uid}` : null, null) },
      { label: 'Project plan started', done: !!loadJson<any>(uid ? `devcollective_project_plan_${uid}` : null, null) },
      { label: 'First project phase finished', done: (loadJson<any>(uid ? `devcollective_project_progress_${uid}` : null, { completedPhases: 0 }).completedPhases || 0) > 0 },
    ];
  }, [user]);
  const ready = checks.filter((c) => c.done).length;
  const card = 'bg-surface-container border-2 border-outline-variant rounded-2xl';

  return (
    <div className="space-y-8 pb-16">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-secondary-container border border-outline-variant rounded-full text-xs font-label-mono font-bold mb-3 text-on-secondary"><Briefcase className="w-3.5 h-3.5" /><span>CRT / PLACEMENT TRAINING</span></div>
        <h2 className="font-headline-lg text-3xl sm:text-4xl font-bold text-on-surface mb-2">Campus Recruitment Training</h2>
        <p className="text-on-surface-variant text-base max-w-2xl">Your final stop. Finish your roadmap levels and a project, then practice the same rounds companies use during campus hiring.</p>
      </div>

      <div className={`${card} p-6 space-y-4`}>
        <div className="flex items-center justify-between"><h3 className="font-bold text-on-surface">Your readiness</h3><span className="text-xs font-label-mono text-on-surface-variant">{ready}/{checks.length} done</span></div>
        <div className="h-2.5 rounded-full bg-surface-container-highest border border-outline-variant overflow-hidden"><div className="h-full bg-secondary-container transition-all" style={{ width: `${(ready / checks.length) * 100}%` }} /></div>
        <ul className="grid sm:grid-cols-2 gap-2">{checks.map((c) => <li key={c.label} className="flex items-center gap-2 text-sm text-on-surface">{c.done ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <Circle className="w-4 h-4 shrink-0 text-on-surface-variant" />}<span className={c.done ? '' : 'text-on-surface-variant'}>{c.label}</span></li>)}</ul>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {MODULES.map(({ icon: Icon, title, desc }) => (
          <div key={title} className={`${card} p-5 flex gap-4`}>
            <div className="w-11 h-11 shrink-0 rounded-xl bg-primary-container text-on-primary border border-outline-variant flex items-center justify-center"><Icon className="w-5 h-5" /></div>
            <div className="min-w-0"><div className="flex items-center gap-2 flex-wrap"><h4 className="font-bold text-on-surface">{title}</h4><span className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-outline-variant bg-tertiary-container text-on-tertiary text-[10px] font-label-mono font-bold uppercase"><Clock className="w-3 h-3" />Coming soon</span></div><p className="text-sm text-on-surface-variant mt-1 leading-relaxed">{desc}</p></div>
          </div>
        ))}
      </div>
    </div>
  );
};
