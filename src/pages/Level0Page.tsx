import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LEVEL_0_MODULES, LEVEL_0_ID, LEVEL_0_SUBTITLE, LEVEL_0_TITLE, Level0Module, Level0Submodule } from '../data/level0';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  Circle,
  Clock,
  Code2,
  Cpu,
  ExternalLink,
  GraduationCap,
  GitBranch,
  Layers,
  Network,
  Play,
  ShieldCheck,
  Sparkles,
  Target,
  Terminal,
  X,
} from 'lucide-react';

interface ModuleProgress {
  verifiedSubmodules: string[];
  completedAt?: string;
}

type ProgressMap = Record<string, ModuleProgress>;

const ICONS: Record<string, React.ReactNode> = {
  layers: <Layers className="w-5 h-5" />,
  'git-branch': <GitBranch className="w-5 h-5" />,
  network: <Network className="w-5 h-5" />,
  'code-2': <Code2 className="w-5 h-5" />,
  'graduation-cap': <GraduationCap className="w-5 h-5" />,
  cpu: <Cpu className="w-5 h-5" />,
};

function youtubeEmbedUrl(resourceUrl: string, embedUrl?: string) {
  if (embedUrl) return embedUrl;
  try {
    const url = new URL(resourceUrl);
    if (url.hostname.includes('youtu.be')) {
      return `https://www.youtube.com/embed/${url.pathname.replace('/', '')}`;
    }
    if (url.hostname.includes('youtube.com')) {
      const id = url.searchParams.get('v');
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
  } catch {
    return undefined;
  }
  return undefined;
}

const storageKey = (userId: string) => `devcollective_level_progress_${userId}`;

export const Level0Page: React.FC = () => {
  const { user } = useAuth();
  const [selectedModuleId, setSelectedModuleId] = useState(LEVEL_0_MODULES[0]?.id ?? '');
  const [selectedSubmoduleId, setSelectedSubmoduleId] = useState(LEVEL_0_MODULES[0]?.submodules[0]?.id ?? '');
  const [progress, setProgress] = useState<ProgressMap>({});
  const [videoResourceId, setVideoResourceId] = useState<string | null>(null);
  const [expandedModuleId, setExpandedModuleId] = useState<string | null>(LEVEL_0_MODULES[0]?.id ?? null);

  useEffect(() => {
    if (!user) return;
    try {
      const raw = localStorage.getItem(storageKey(user.id));
      if (raw) setProgress(JSON.parse(raw));
    } catch (error) {
      console.error('Failed to load Level 0 progress', error);
    }
  }, [user]);

  const selectedModule = useMemo(
    () => LEVEL_0_MODULES.find((module) => module.id === selectedModuleId) ?? LEVEL_0_MODULES[0],
    [selectedModuleId]
  );

  const selectedSubmodule = useMemo(
    () => selectedModule?.submodules.find((submodule) => submodule.id === selectedSubmoduleId) ?? selectedModule?.submodules[0],
    [selectedModule, selectedSubmoduleId]
  );

  const moduleCompletedCount = LEVEL_0_MODULES.reduce((count, module) => {
    const moduleProgress = progress[module.id];
    return count + (moduleProgress?.completedAt ? 1 : 0);
  }, 0);

  const verifiedSubmoduleCount = LEVEL_0_MODULES.reduce(
    (total, module) => total + (progress[module.id]?.verifiedSubmodules.length ?? 0),
    0
  );

  const totalSubmoduleCount = LEVEL_0_MODULES.reduce((total, module) => total + module.submodules.length, 0);
  const levelComplete = moduleCompletedCount === LEVEL_0_MODULES.length;
  const overallPercent = Math.round((verifiedSubmoduleCount / totalSubmoduleCount) * 100);

  const persistProgress = (next: ProgressMap) => {
    setProgress(next);
    if (user) localStorage.setItem(storageKey(user.id), JSON.stringify(next));
  };

  const markSubmoduleVerified = (module: Level0Module, submodule: Level0Submodule) => {
    if (!user) return;
    const current = progress[module.id] ?? { verifiedSubmodules: [] };
    if (current.verifiedSubmodules.includes(submodule.id)) return;

    const verifiedSubmodules = [...current.verifiedSubmodules, submodule.id];
    const completed = verifiedSubmodules.length === module.submodules.length;

    persistProgress({
      ...progress,
      [module.id]: {
        verifiedSubmodules,
        completedAt: completed ? new Date().toISOString() : current.completedAt,
      },
    });
  };

  const selectModule = (module: Level0Module) => {
    setSelectedModuleId(module.id);
    setExpandedModuleId(module.id);
    setSelectedSubmoduleId(module.submodules[0]?.id ?? '');
  };

  const selectSubmodule = (module: Level0Module, submodule: Level0Submodule) => {
    setSelectedModuleId(module.id);
    setExpandedModuleId(module.id);
    setSelectedSubmoduleId(submodule.id);
    setVideoResourceId(null);
  };

  return (
    <div className="min-h-full text-on-background pb-16">
      <div className="max-w-[1500px] mx-auto space-y-7">
        <header className="bg-surface-container border-2 border-primary/30 rounded-3xl p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative flex flex-col xl:flex-row xl:items-end justify-between gap-7">
            <div className="max-w-4xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary font-label-mono text-[11px] font-bold uppercase">
                <ShieldCheck className="w-3.5 h-3.5" />
                Mandatory Level 0
              </div>
              <h1 className="font-display-2xl text-4xl sm:text-5xl font-black text-white tracking-tight mt-4">
                {LEVEL_0_TITLE}
              </h1>
              <p className="text-on-surface-variant max-w-3xl mt-3 text-base leading-relaxed">
                {LEVEL_0_SUBTITLE}. Build the common CSE foundation before unlocking specialization.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 min-w-[260px]">
              <div className="bg-surface border border-outline-variant rounded-2xl p-4">
                <span className="font-label-mono text-[10px] uppercase text-outline">Level Progress</span>
                <div className="text-3xl font-black text-white mt-1">{overallPercent}%</div>
              </div>
              <div className="bg-surface border border-outline-variant rounded-2xl p-4">
                <span className="font-label-mono text-[10px] uppercase text-outline">Modules</span>
                <div className="text-3xl font-black text-primary mt-1">{moduleCompletedCount}/{LEVEL_0_MODULES.length}</div>
              </div>
            </div>
          </div>

          <div className="relative mt-7">
            <div className="h-3 bg-surface-container-lowest border border-outline-variant rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary via-secondary to-tertiary transition-all duration-700"
                style={{ width: `${overallPercent}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-[11px] font-label-mono uppercase text-outline">
              <span>{verifiedSubmoduleCount} / {totalSubmoduleCount} verified sub-modules</span>
              <span>{levelComplete ? 'Level Unlocked' : 'Specialization Locked'}</span>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[310px_minmax(0,1fr)] xl:grid-cols-[340px_minmax(0,1fr)] gap-6 items-start">
          <aside className="bg-surface-container border-2 border-outline-variant rounded-3xl p-3 sticky top-4">
            <div className="px-3 py-3 flex items-center gap-3 border-b border-outline-variant/60 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 text-primary flex items-center justify-center">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-white text-sm">Foundation Path</div>
                <div className="text-[10px] text-outline font-label-mono uppercase">6 modules · mandatory</div>
              </div>
            </div>

            <div className="space-y-1.5">
              {LEVEL_0_MODULES.map((module) => {
                const moduleProgress = progress[module.id]?.verifiedSubmodules.length ?? 0;
                const moduleComplete = Boolean(progress[module.id]?.completedAt);
                const active = selectedModule?.id === module.id;
                const expanded = expandedModuleId === module.id;
                return (
                  <div key={module.id} className="rounded-2xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => {
                        selectModule(module);
                        setExpandedModuleId(expanded ? null : module.id);
                      }}
                      className={`w-full text-left px-3 py-3 rounded-2xl border transition-all flex items-center gap-3 ${
                        active
                          ? 'bg-primary/10 border-primary/40'
                          : 'border-transparent hover:border-outline-variant hover:bg-surface-container-low'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${moduleComplete ? 'bg-tertiary/10 text-tertiary' : active ? 'bg-primary/15 text-primary' : 'bg-surface-container-high text-on-surface-variant'}`}>
                        {moduleComplete ? <CheckCircle2 className="w-5 h-5" /> : ICONS[module.icon]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-sm text-white truncate">{module.order}. {module.title}</div>
                        <div className="mt-1 flex items-center justify-between gap-2">
                          <span className="font-label-mono text-[9px] uppercase text-outline">{moduleProgress}/{module.submodules.length} verified</span>
                          <ChevronDown className={`w-4 h-4 text-outline transition-transform ${expanded ? 'rotate-180' : ''}`} />
                        </div>
                      </div>
                    </button>

                    {expanded && (
                      <div className="px-2 pb-2 pt-1 space-y-1">
                        {module.submodules.map((submodule) => {
                          const verified = progress[module.id]?.verifiedSubmodules.includes(submodule.id);
                          const activeSub = selectedSubmodule?.id === submodule.id;
                          return (
                            <button
                              key={submodule.id}
                              type="button"
                              onClick={() => selectSubmodule(module, submodule)}
                              className={`w-full text-left pl-12 pr-2 py-2 rounded-xl text-xs transition-all flex items-center gap-2 ${
                                activeSub ? 'bg-surface-container-highest text-white' : 'text-on-surface-variant hover:bg-surface-container-low'
                              }`}
                            >
                              {verified ? <CheckCircle2 className="w-3.5 h-3.5 text-tertiary shrink-0" /> : <Circle className="w-3.5 h-3.5 text-outline shrink-0" />}
                              <span className="truncate">{submodule.title}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-4 p-3 rounded-2xl bg-surface border border-outline-variant">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Award className="w-4 h-4 text-primary" />
                Verified progression
              </div>
              <p className="text-[11px] text-on-surface-variant mt-1 leading-relaxed">
                Completion is recorded from verified learning actions in this Level-0 workspace, not from a client-side progress percentage.
              </p>
            </div>
          </aside>

          <main className="min-w-0 space-y-6">
            {selectedModule && selectedSubmodule && (
              <>
                <section className="bg-surface-container border-2 border-outline-variant rounded-3xl overflow-hidden">
                  <div className="p-6 sm:p-8 border-b border-outline-variant/60">
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      <span className="px-2.5 py-1 rounded-full bg-secondary/10 border border-secondary/30 text-secondary text-[10px] font-label-mono uppercase font-bold">
                        Module {selectedModule.order}
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-surface border border-outline-variant text-outline text-[10px] font-label-mono uppercase">
                        {selectedModule.estimatedMinutes} min total
                      </span>
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-black text-white">{selectedModule.title}</h2>
                    <p className="text-on-surface-variant mt-2 max-w-3xl">{selectedModule.description}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-[260px_minmax(0,1fr)]">
                    <div className="p-4 border-b md:border-b-0 md:border-r border-outline-variant/60 bg-surface-container-low/50">
                      <div className="font-label-mono text-[10px] uppercase text-outline px-2 pb-2">Sub-module</div>
                      <div className="space-y-1">
                        {selectedModule.submodules.map((submodule, index) => {
                          const verified = progress[selectedModule.id]?.verifiedSubmodules.includes(submodule.id);
                          const active = submodule.id === selectedSubmodule.id;
                          return (
                            <button
                              type="button"
                              key={submodule.id}
                              onClick={() => selectSubmodule(selectedModule, submodule)}
                              className={`w-full text-left p-3 rounded-xl border transition-all ${active ? 'border-primary/40 bg-primary/10' : 'border-transparent hover:border-outline-variant'}`}
                            >
                              <div className="flex items-start gap-2.5">
                                <div className={`mt-0.5 shrink-0 ${verified ? 'text-tertiary' : active ? 'text-primary' : 'text-outline'}`}>
                                  {verified ? <CheckCircle2 className="w-4 h-4" /> : <span className="font-label-mono text-[10px]">0{index + 1}</span>}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-bold text-xs text-white leading-snug">{submodule.title}</div>
                                  <div className="flex items-center gap-1 mt-1 text-[10px] text-outline">
                                    <Clock className="w-3 h-3" /> {submodule.estimatedMinutes} min
                                  </div>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="p-6 sm:p-8 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 text-[10px] font-label-mono uppercase text-primary mb-2">
                            {selectedSubmodule.kind === 'interactive' && <Sparkles className="w-3.5 h-3.5" />}
                            {selectedSubmodule.kind === 'practical' && <Terminal className="w-3.5 h-3.5" />}
                            {selectedSubmodule.kind === 'assessment' && <ShieldCheck className="w-3.5 h-3.5" />}
                            {selectedSubmodule.kind}
                          </div>
                          <h3 className="text-2xl font-black text-white">{selectedSubmodule.title}</h3>
                          <p className="text-sm text-on-surface-variant mt-1 max-w-2xl">{selectedSubmodule.description}</p>
                        </div>
                        {progress[selectedModule.id]?.verifiedSubmodules.includes(selectedSubmodule.id) && (
                          <div className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl bg-tertiary/10 border border-tertiary/30 text-tertiary text-xs font-bold">
                            <Check className="w-4 h-4" /> Verified
                          </div>
                        )}
                      </div>

                      <div className="mt-7 grid gap-3">
                        {selectedSubmodule.content.map((paragraph, index) => (
                          <div key={index} className="p-4 bg-surface border border-outline-variant rounded-2xl flex gap-3">
                            <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 font-label-mono text-xs font-bold">{index + 1}</div>
                            <p className="text-sm leading-7 text-on-surface-variant">{paragraph}</p>
                          </div>
                        ))}
                      </div>

                      {selectedSubmodule.resources && selectedSubmodule.resources.length > 0 && (
                        <div className="mt-8 rounded-2xl border-2 border-outline-variant bg-surface overflow-hidden">
                          <div className="px-5 py-4 border-b border-outline-variant/60 flex items-center gap-3">
                            <BookOpen className="w-5 h-5 text-secondary" />
                            <div>
                              <div className="font-bold text-white">Best Free Resources</div>
                              <div className="text-[10px] font-label-mono text-outline uppercase">Curated for this sub-module</div>
                            </div>
                          </div>
                          <div className="p-4 space-y-3">
                            {selectedSubmodule.resources.map((resource) => {
                              const embed = resource.type === 'video' ? youtubeEmbedUrl(resource.url, resource.embedUrl) : undefined;
                              return (
                                <div key={resource.id} className="rounded-2xl bg-surface-container border border-outline-variant overflow-hidden">
                                  {embed ? (
                                    <div className="aspect-video bg-black">
                                      <iframe
                                        src={embed}
                                        title={resource.title}
                                        className="w-full h-full"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                        allowFullScreen
                                        referrerPolicy="strict-origin-when-cross-origin"
                                      />
                                    </div>
                                  ) : null}
                                  <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                      <div className="flex items-center gap-2 mb-1">
                                        {resource.type === 'video' ? <Play className="w-4 h-4 text-primary" /> : <BookOpen className="w-4 h-4 text-secondary" />}
                                        <span className="text-xs font-label-mono uppercase text-outline">{resource.provider ?? resource.type}</span>
                                      </div>
                                      <div className="font-bold text-white">{resource.title}</div>
                                      <p className="text-xs text-on-surface-variant mt-1">{resource.description}</p>
                                    </div>
                                    {!embed && (
                                      <a
                                        href={resource.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-surface border border-outline-variant hover:border-primary text-xs font-bold text-white shrink-0"
                                      >
                                        Open resource <ExternalLink className="w-3.5 h-3.5" />
                                      </a>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div className="mt-8 p-5 rounded-2xl border border-primary/20 bg-primary/5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                        <div>
                          <div className="text-xs font-bold text-white">Verification checkpoint</div>
                          <p className="text-xs text-on-surface-variant mt-1 max-w-xl">
                            Review the material and complete the sub-module activity. Only an explicit verified checkpoint changes stored Level-0 progress.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => markSubmoduleVerified(selectedModule, selectedSubmodule)}
                          disabled={progress[selectedModule.id]?.verifiedSubmodules.includes(selectedSubmodule.id)}
                          className="px-5 py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-white text-xs font-bold uppercase tracking-wide disabled:opacity-50 disabled:cursor-default shrink-0"
                        >
                          {progress[selectedModule.id]?.verifiedSubmodules.includes(selectedSubmodule.id) ? 'Verified' : 'Complete Checkpoint'}
                        </button>
                      </div>

                      <div className="mt-6 flex items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            const index = selectedModule.submodules.findIndex((sub) => sub.id === selectedSubmodule.id);
                            if (index > 0) selectSubmodule(selectedModule, selectedModule.submodules[index - 1]);
                          }}
                          disabled={selectedModule.submodules.findIndex((sub) => sub.id === selectedSubmodule.id) <= 0}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-outline-variant text-xs font-bold text-on-surface-variant disabled:opacity-30"
                        >
                          <ArrowLeft className="w-4 h-4" /> Previous
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const index = selectedModule.submodules.findIndex((sub) => sub.id === selectedSubmodule.id);
                            if (index < selectedModule.submodules.length - 1) {
                              selectSubmodule(selectedModule, selectedModule.submodules[index + 1]);
                            }
                          }}
                          disabled={selectedModule.submodules.findIndex((sub) => sub.id === selectedSubmodule.id) >= selectedModule.submodules.length - 1}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface border border-outline-variant text-xs font-bold text-white disabled:opacity-30"
                        >
                          Next <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-surface-container border-2 border-outline-variant rounded-2xl p-5">
                    <span className="font-label-mono text-[10px] text-outline uppercase">Module REP</span>
                    <div className="text-2xl font-black text-primary mt-1">+{selectedModule.repReward}</div>
                    <p className="text-xs text-on-surface-variant mt-1">Awarded when the module is genuinely completed.</p>
                  </div>
                  <div className="bg-surface-container border-2 border-outline-variant rounded-2xl p-5">
                    <span className="font-label-mono text-[10px] text-outline uppercase">Sub-module REP</span>
                    <div className="text-2xl font-black text-secondary mt-1">+{selectedSubmodule.repReward}</div>
                    <p className="text-xs text-on-surface-variant mt-1">Curriculum reward metadata; server-side REP will be authoritative.</p>
                  </div>
                  <div className="bg-surface-container border-2 border-outline-variant rounded-2xl p-5">
                    <span className="font-label-mono text-[10px] text-outline uppercase">Unlock State</span>
                    <div className={`text-2xl font-black mt-1 ${levelComplete ? 'text-tertiary' : 'text-error'}`}>
                      {levelComplete ? 'OPEN' : 'LOCKED'}
                    </div>
                    <p className="text-xs text-on-surface-variant mt-1">Level 1 stays locked until every Level-0 module is verified.</p>
                  </div>
                </section>
              </>
            )}
          </main>
        </div>
      </div>

      {videoResourceId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm p-4 flex items-center justify-center" onClick={() => setVideoResourceId(null)}>
          <div className="max-w-4xl w-full bg-surface-container border-2 border-outline-variant rounded-2xl overflow-hidden" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-outline-variant">
              <div className="font-bold text-white">Video Resource</div>
              <button type="button" onClick={() => setVideoResourceId(null)} className="p-2 rounded-lg hover:bg-surface-container-high text-on-surface-variant">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="aspect-video bg-black">
              {(() => {
                const resource = selectedSubmodule?.resources?.find((item) => item.id === videoResourceId);
                if (!resource) return null;
                const embed = youtubeEmbedUrl(resource.url, resource.embedUrl);
                return embed ? (
                  <iframe
                    src={embed}
                    title={resource.title}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    referrerPolicy="strict-origin-when-cross-origin"
                  />
                ) : null;
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
