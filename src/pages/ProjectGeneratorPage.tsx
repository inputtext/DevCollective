import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Rocket, Check, Lock, Trophy, Star, Target, Layers, ClipboardCheck, ImagePlus, Loader2, RefreshCw, X, Link2, HelpCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AiChatPanel, renderFormattedText } from '../components/AiChatPanel';
import { fileToChatImage, loadJson, postJson, saveJson, ChatImagePayload } from '../lib/aiClient';

interface Phase { title: string; goal: string; tasks: string[]; youWillLearn: string; checkpoint: string; xp: number }
interface ProjectPlan { title: string; tagline?: string; problemStatement: string; whoItHelps?: string; expectedOutput: string; difficulty?: string; whyRecruitersCare?: string; techStack: string[]; architecture: string; phases: Phase[] }
interface Progress { completedPhases: number; doneTasks: Record<string, boolean>; xp: number }

const XP_PER_LEVEL = 200;
const WELCOME = "Hi! I am your Project Generator. I help you build a real project step by step, like a game. Each phase is small, you earn XP, and by the end you have something recruiters like to see.\n\nTell me what you want, or tap an option below and I will suggest ideas based on your roadmap.";

export const ProjectGeneratorPage: React.FC = () => {
  const { user } = useAuth();
  const uid = user?.id || null;
  const planKey = uid ? `devcollective_project_plan_${uid}` : null;
  const progKey = uid ? `devcollective_project_progress_${uid}` : null;
  const reviewKey = uid ? `devcollective_project_review_${uid}` : null;
  const roadmap = useMemo(() => loadJson<any>(uid ? `devcollective_ai_roadmap_${uid}` : null, null), [uid]);

  const [plan, setPlan] = useState<ProjectPlan | null>(null);
  const [progress, setProgress] = useState<Progress>({ completedPhases: 0, doneTasks: {}, xp: 0 });
  const [tab, setTab] = useState<'board' | 'review'>('board');
  const [tipFor, setTipFor] = useState<number | null>(null);
  const loaded = useRef<string | null>(null);

  useEffect(() => {
    setPlan(loadJson<ProjectPlan | null>(planKey, null));
    setProgress(loadJson<Progress>(progKey, { completedPhases: 0, doneTasks: {}, xp: 0 }));
    loaded.current = uid;
  }, [planKey, progKey, uid]);
  useEffect(() => { if (loaded.current === uid) saveJson(progKey, progress); }, [progress, progKey, uid]);

  const onData = (data: any) => {
    if (data?.plan?.phases?.length) {
      setPlan(data.plan); saveJson(planKey, data.plan);
      const fresh = { completedPhases: 0, doneTasks: {}, xp: 0 }; setProgress(fresh); setTab('board');
    }
  };

  const level = Math.floor(progress.xp / XP_PER_LEVEL) + 1;
  const levelPct = Math.round(((progress.xp % XP_PER_LEVEL) / XP_PER_LEVEL) * 100);
  const toggleTask = (pi: number, ti: number) => { if (pi !== progress.completedPhases) return; const k = `${pi}-${ti}`; setProgress((p) => ({ ...p, doneTasks: { ...p.doneTasks, [k]: !p.doneTasks[k] } })); };
  const phaseReady = (pi: number) => !!plan && plan.phases[pi].tasks.every((_, ti) => progress.doneTasks[`${pi}-${ti}`]);
  const completePhase = (pi: number) => { if (!plan || pi !== progress.completedPhases || !phaseReady(pi)) return; setProgress((p) => ({ ...p, completedPhases: p.completedPhases + 1, xp: p.xp + (plan.phases[pi].xp || 100) })); };
  const resetProject = () => { if (!window.confirm('Start a new project? Your current plan and XP will be cleared.')) return; setPlan(null); setProgress({ completedPhases: 0, doneTasks: {}, xp: 0 }); saveJson(planKey, null); };

  const buildContext = () => ({
    profile: user ? { name: user.name, branch: user.branch, academicYear: user.academicYear, skills: (user as any).skills, rep: user.rep, level: user.level } : undefined,
    roadmap,
    project: plan ? { title: plan.title, completedPhases: progress.completedPhases, totalPhases: plan.phases.length } : undefined,
    plan,
  });

  // ---- review state
  const [desc, setDesc] = useState(''); const [repo, setRepo] = useState('');
  const [shot, setShot] = useState<ChatImagePayload | null>(null);
  const [reviewing, setReviewing] = useState(false); const [reviewErr, setReviewErr] = useState<string | null>(null);
  const [review, setReview] = useState<string>('');
  useEffect(() => { setReview(loadJson<string>(reviewKey, '')); }, [reviewKey]);
  const fileRef = useRef<HTMLInputElement>(null);
  const runReview = async () => {
    if (!desc.trim() && !repo.trim() && !shot) { setReviewErr('Add a short description, a GitHub link, or a screenshot first.'); return; }
    setReviewing(true); setReviewErr(null);
    try {
      const data = await postJson<{ reply: string }>('/api/ai/project-review', {
        message: desc.trim() || 'Please review my project.', repoUrl: repo.trim(), context: buildContext(),
        image: shot ? { mimeType: shot.mimeType, data: shot.data } : undefined,
      });
      setReview(data.reply); saveJson(reviewKey, data.reply);
    } catch (e: any) { setReviewErr(e.message); } finally { setReviewing(false); }
  };

  const card = 'bg-surface-container border-2 border-outline-variant rounded-2xl';

  return (
    <div className="space-y-8 pb-16">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-tertiary-container border border-outline-variant rounded-full text-xs font-label-mono font-bold mb-3 text-on-tertiary"><Rocket className="w-3.5 h-3.5" /><span>PROJECT GENERATOR AGENT</span></div>
          <h2 className="font-headline-lg text-3xl sm:text-4xl font-bold text-on-surface mb-2">Build a project like a game</h2>
          <p className="text-on-surface-variant text-base max-w-2xl">Get project ideas that match what companies hire for today. Finish one small phase at a time, earn XP, and ask the agent to review your work when you are done.</p>
        </div>
        <div className={`${card} px-5 py-4 min-w-[15rem]`}>
          <div className="flex items-center justify-between text-xs font-label-mono uppercase text-on-surface-variant"><span className="flex items-center gap-1.5"><Trophy className="w-4 h-4" />Builder level {level}</span><span>{progress.xp} XP</span></div>
          <div className="mt-2 h-2.5 rounded-full bg-surface-container-highest border border-outline-variant overflow-hidden"><div className="h-full bg-primary-container transition-all" style={{ width: `${levelPct}%` }} /></div>
          <p className="mt-1.5 text-[10px] text-on-surface-variant">{XP_PER_LEVEL - (progress.xp % XP_PER_LEVEL)} XP to the next level</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-start">
        {/* Chat */}
        <div className={`${card} xl:col-span-2 overflow-hidden`}>
          <div className="px-5 py-4 border-b-2 border-outline-variant bg-surface-container-low"><h3 className="font-bold text-on-surface">Talk to the agent</h3><p className="text-xs text-on-surface-variant">Ask for ideas, pick one, and it builds your quest. Photos and voice are supported.</p></div>
          <AiChatPanel
            heightClass="h-[36rem]" storageKey={uid ? `devcollective_projectgen_chat_${uid}` : null}
            welcome={WELCOME} endpoint="/api/ai/project-chat" buildContext={buildContext} onData={onData}
            placeholder="Ask for ideas or answer the agent..."
            suggestions={['Suggest 3 project ideas for my roadmap', 'Give me a beginner warm-up project', 'Show me a trending job-ready idea']}
          />
        </div>

        {/* Board / Review */}
        <div className="xl:col-span-3 space-y-4">
          <div className="flex gap-2 bg-surface-container border-2 border-outline-variant p-1.5 rounded-2xl w-fit">
            {([['board', 'Project Board', Layers], ['review', 'AI Project Review', ClipboardCheck]] as const).map(([id, label, Icon]) => (
              <button key={id} onClick={() => setTab(id)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold font-label-mono uppercase transition-all ${tab === id ? 'bg-primary-container text-on-primary border border-outline-variant' : 'text-on-surface-variant hover:text-on-surface'}`}><Icon className="w-4 h-4" />{label}</button>
            ))}
          </div>

          {tab === 'board' && (!plan ? (
            <div className={`${card} p-8 text-center space-y-3`}>
              <div className="w-14 h-14 mx-auto rounded-2xl bg-primary-container text-on-primary border border-outline-variant flex items-center justify-center"><Target className="w-7 h-7" /></div>
              <h3 className="text-xl font-bold text-on-surface">No quest yet</h3>
              <p className="text-sm text-on-surface-variant max-w-md mx-auto">Chat with the agent on the left, choose an idea, and your project board with phases, tasks and XP will appear here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className={`${card} p-6 space-y-4`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div><div className="flex items-center gap-2 mb-1">{plan.difficulty && <span className="px-2.5 py-0.5 rounded-full border border-outline-variant bg-tertiary-container text-on-tertiary text-[10px] font-label-mono font-bold uppercase">{plan.difficulty}</span>}<span className="text-[10px] font-label-mono text-on-surface-variant uppercase">{progress.completedPhases}/{plan.phases.length} phases done</span></div>
                    <h3 className="text-2xl font-bold text-on-surface">{plan.title}</h3>{plan.tagline && <p className="text-sm text-on-surface-variant">{plan.tagline}</p>}</div>
                  <button onClick={resetProject} className="flex items-center gap-1.5 text-xs font-label-mono uppercase text-on-surface-variant hover:text-on-surface"><RefreshCw className="w-3.5 h-3.5" />New project</button>
                </div>
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/60"><p className="font-label-mono text-[10px] uppercase text-outline mb-1">The problem</p><p className="text-on-surface leading-relaxed">{plan.problemStatement}</p>{plan.whoItHelps && <p className="text-on-surface-variant mt-2 text-xs">Helps: {plan.whoItHelps}</p>}</div>
                  <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/60"><p className="font-label-mono text-[10px] uppercase text-outline mb-1">Expected result</p><p className="text-on-surface leading-relaxed">{plan.expectedOutput}</p>{plan.whyRecruitersCare && <p className="text-on-surface-variant mt-2 text-xs">Why recruiters care: {plan.whyRecruitersCare}</p>}</div>
                </div>
                <div className="flex flex-wrap gap-2">{plan.techStack.map((t) => <span key={t} className="px-3 py-1 rounded-full border border-outline-variant bg-surface-container-low text-xs font-label-mono text-on-surface-variant">{t}</span>)}</div>
                <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/60 text-sm text-on-surface space-y-0.5"><p className="font-label-mono text-[10px] uppercase text-outline mb-1">System architecture</p>{renderFormattedText(plan.architecture)}</div>
              </div>

              {plan.phases.map((ph, pi) => {
                const done = pi < progress.completedPhases; const current = pi === progress.completedPhases; const locked = pi > progress.completedPhases;
                return (
                  <div key={pi} className={`${card} p-5 ${locked ? 'opacity-60' : ''}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 shrink-0 rounded-xl border border-outline-variant flex items-center justify-center font-black font-label-mono ${done ? 'bg-secondary-container text-on-secondary' : current ? 'bg-primary-container text-on-primary' : 'bg-surface-container-high text-on-surface-variant'}`}>{done ? <Check className="w-5 h-5" /> : locked ? <Lock className="w-4 h-4" /> : pi + 1}</div>
                      <div className="min-w-0 flex-1"><p className="font-label-mono text-[10px] uppercase text-on-surface-variant">Phase {pi + 1}{done ? ' complete' : current ? ' (current)' : ' (locked)'}</p><h4 className="font-bold text-on-surface">{ph.title}</h4></div>
                      <span className="flex items-center gap-1 text-xs font-label-mono font-bold text-on-surface"><Star className="w-3.5 h-3.5" />{ph.xp} XP</span>
                    </div>
                    {!locked && (
                      <div className="mt-4 space-y-3">
                        <p className="text-sm text-on-surface-variant">{ph.goal}</p>
                        <ul className="space-y-2">{ph.tasks.map((t, ti) => { const on = done || !!progress.doneTasks[`${pi}-${ti}`]; return (
                          <li key={ti}><label className={`flex items-start gap-3 p-3 rounded-xl border border-outline-variant/60 bg-surface-container-low ${current ? 'cursor-pointer hover:border-primary' : ''}`}><input type="checkbox" checked={on} disabled={!current} onChange={() => toggleTask(pi, ti)} className="mt-0.5 w-4 h-4 accent-current" /><span className={`text-sm ${on ? 'line-through text-on-surface-variant' : 'text-on-surface'}`}>{t}</span></label></li>); })}</ul>
                        <p className="text-xs text-on-surface-variant"><strong className="text-on-surface">You will learn:</strong> {ph.youWillLearn}</p>
                        {current && (
                          <div className="flex flex-wrap items-center gap-3">
                            <button onClick={() => setTipFor(tipFor === pi ? null : pi)} className="flex items-center gap-1.5 text-xs font-label-mono uppercase text-on-surface-variant hover:text-on-surface"><HelpCircle className="w-4 h-4" />Checkpoint question</button>
                            <button disabled={!phaseReady(pi)} onClick={() => completePhase(pi)} className="ml-auto px-5 py-2.5 rounded-xl bg-primary-container text-on-primary border border-outline-variant font-bold text-sm disabled:opacity-50 hover:brightness-95">{phaseReady(pi) ? `Claim ${ph.xp} XP and unlock next` : 'Finish all tasks to unlock'}</button>
                          </div>
                        )}
                        {current && tipFor === pi && <div className="p-3 rounded-xl bg-tertiary-container text-on-tertiary border border-outline-variant text-sm">{ph.checkpoint}<p className="text-xs mt-1 opacity-80">Answer it in the chat and the agent will tell you if you understood it.</p></div>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}

          {tab === 'review' && (
            <div className={`${card} p-6 space-y-4`}>
              <div><h3 className="text-xl font-bold text-on-surface">Get an AI review of your project</h3><p className="text-sm text-on-surface-variant">Tell the agent what you built. It explains how it is made, what is good, what to improve, and what to do next.</p></div>
              <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={5} placeholder="What does your project do? Which tools did you use? What part are you unsure about?" className="w-full bg-surface-container-lowest border-2 border-outline-variant rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant outline-none focus:border-primary" />
              <div className="flex items-center gap-2 bg-surface-container-lowest border-2 border-outline-variant rounded-xl px-3"><Link2 className="w-4 h-4 text-on-surface-variant shrink-0" /><input value={repo} onChange={(e) => setRepo(e.target.value)} placeholder="GitHub link (optional, public repos only)" className="flex-1 bg-transparent py-3 text-sm text-on-surface placeholder:text-on-surface-variant outline-none" /></div>
              <div className="flex flex-wrap items-center gap-3">
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) { try { setShot(await fileToChatImage(f)); } catch (er: any) { setReviewErr(er.message); } } }} />
                <button type="button" onClick={() => fileRef.current?.click()} className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-outline-variant text-sm text-on-surface hover:bg-surface-container-high"><ImagePlus className="w-4 h-4" />Add screenshot</button>
                {shot && <div className="relative"><img src={shot.preview} alt="screenshot" className="h-12 rounded-lg border border-outline-variant" /><button onClick={() => setShot(null)} aria-label="Remove screenshot" className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-surface-container-highest border border-outline-variant flex items-center justify-center"><X className="w-3 h-3" /></button></div>}
                <button onClick={runReview} disabled={reviewing} className="ml-auto px-6 py-2.5 rounded-xl bg-primary-container text-on-primary border border-outline-variant font-bold text-sm disabled:opacity-60 flex items-center gap-2 hover:brightness-95">{reviewing ? <><Loader2 className="w-4 h-4 animate-spin" />Reviewing...</> : 'Review my project'}</button>
              </div>
              {reviewErr && <div className="p-3 rounded-xl bg-error-container text-on-error border border-outline-variant text-sm">{reviewErr}</div>}
              {review && <div className="p-5 rounded-xl bg-surface-container-low border border-outline-variant/60 text-sm text-on-surface space-y-0.5 leading-relaxed">{renderFormattedText(review)}</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
