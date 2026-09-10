import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Marquee } from '../components/Marquee';
import { ScrollReveal } from '../components/ScrollReveal';
import { SystemSignal } from '../components/SystemSignal';
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  GitBranch,
  Layers3,
  Terminal,
  Trophy,
  UserCheck,
  Users,
} from 'lucide-react';

const modules = [
  { number: '01', title: 'COMMUNITY', description: 'Find builders, share progress, exchange feedback, and work alongside people on the same climb.', icon: Users, tone: 'dc-pastel-lavender', action: 'community' as const },
  { number: '02', title: 'ROADMAPS', description: 'Turn a vague career goal into a sequence of skills, projects, milestones, and proof of work.', icon: GitBranch, tone: 'dc-pastel-mint', action: 'roadmap' as const },
  { number: '03', title: 'MENTORS', description: 'Get perspective from experienced developers that goes beyond tutorials and course checklists.', icon: UserCheck, tone: 'dc-pastel-yellow', action: 'mentors' as const },
  { number: '04', title: 'REPUTATION', description: 'Make your work visible. Consistency, projects, contributions, and mentoring become part of your developer identity.', icon: Trophy, tone: 'dc-pastel-pink', action: 'leaderboard' as const },
];

const marqueeItems = ['LEARN BY SHIPPING', 'BUILD IN PUBLIC', 'FIND YOUR PEOPLE', 'MENTORSHIP', 'ROADMAPS', 'PROOF OF WORK', 'SHIP IT', 'C·FLOW READY'];

const CFLOW_LANDING_URL = 'https://cflow-landing-web.onrender.com';

export const LandingPage: React.FC = () => {
  const { setActiveTab } = useAuth();

  return (
    <div className="dc-public min-h-screen overflow-hidden">
      <section className="relative min-h-[calc(100vh-74px)] border-b-2 border-outline-variant" data-gsap-reveal>
        <div className="relative max-w-[1500px] mx-auto px-5 sm:px-8 lg:px-12 pt-8 sm:pt-12 lg:pt-16 pb-10">
          <div className="flex items-center justify-between gap-4 border-b-2 border-outline-variant pb-4">
            <span className="dc-mono text-[10px] sm:text-xs uppercase tracking-[0.18em]">DC / 00 — Developer Collective</span>
            <span className="dc-mono text-[10px] sm:text-xs uppercase tracking-[0.18em] hidden sm:block">LEARN → BUILD → COLLABORATE → SHIP</span>
          </div>

          <div className="pt-12 sm:pt-16 lg:pt-20 grid lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-16 items-center">
            <div>
              <p className="dc-mono text-[10px] sm:text-xs uppercase tracking-[0.22em] mb-6">A technical collective for developers in the making.</p>
              <h1 className="dc-display text-[clamp(4rem,10vw,9.5rem)] max-w-6xl">
                LEARN.<br />BUILD.<br /><span className="text-primary">SHIP.</span>
              </h1>
              <p className="mt-8 text-base sm:text-lg leading-relaxed text-on-surface-variant max-w-xl">
                DevCollective connects community, mentorship, learning paths, projects, and reputation into one serious developer workspace.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <button onClick={() => setActiveTab('register')} className="dc-hard-shadow-sm inline-flex items-center gap-3 px-6 py-4 bg-primary text-on-primary border-2 border-outline-variant font-bold uppercase tracking-wide">Join the collective <ArrowRight className="w-4 h-4" /></button>
                <button onClick={() => setActiveTab('login')} className="inline-flex items-center gap-3 px-6 py-4 bg-surface border-2 border-outline-variant font-bold uppercase tracking-wide">Sign in</button>
              </div>
            </div>

            <div className="border-2 border-outline-variant bg-surface dc-hard-shadow" data-gsap-reveal>
              <div className="flex items-center justify-between border-b-2 border-outline-variant px-4 py-3">
                <span className="dc-mono text-[9px] uppercase tracking-[0.16em]">LIVE / DEV WORKSPACE</span>
                <span className="flex items-center gap-2 dc-mono text-[9px] uppercase"><span className="dc-status-dot" /> READY</span>
              </div>
              <div className="grid grid-cols-[1.35fr_0.65fr] min-h-[360px]">
                <div className="bg-dc-blue border-r-2 border-outline-variant p-5 sm:p-7 font-mono text-xs sm:text-sm text-[#171717]">
                  <div className="dc-mono text-[9px] uppercase tracking-[0.16em] mb-8">01 / CURRENT MISSION</div>
                  <pre className="leading-[1.8] whitespace-pre-wrap">{`const mission = {\n  goal: "BUILD A PROJECT",\n  path: "FULL STACK",\n  status: "ACTIVE"\n};\n\nmission.progress = 72;\nship(mission);`}</pre>
                  <div className="mt-8 border-t-2 border-[#171717] pt-4 flex justify-between dc-mono text-[9px] uppercase"><span>TRACE / 006</span><span>72%</span></div>
                </div>
                <div className="bg-dc-lavender p-5 flex flex-col justify-between text-[#171717]">
                  <div>
                    <div className="dc-mono text-[9px] uppercase tracking-[0.16em]">STATE / ACTIVE</div>
                    <div className="mt-5 space-y-3 dc-mono text-[10px] uppercase">
                      <div className="border-2 border-[#171717] bg-dc-mint p-3">LEARN <span className="float-right">✓</span></div>
                      <div className="border-2 border-[#171717] bg-dc-yellow p-3">BUILD <span className="float-right">→</span></div>
                      <div className="border-2 border-[#171717] bg-[#FFF9F0] p-3">COLLABORATE <span className="float-right">03</span></div>
                      <div className="border-2 border-[#171717] bg-dc-pink p-3">SHIP <span className="float-right">NEXT</span></div>
                    </div>
                  </div>
                  <div className="pt-6 dc-mono text-[9px] uppercase leading-relaxed">REP +120<br />STREAK 08 DAYS<br />FLOW STATE READY</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 border-2 border-outline-variant">
            {[
              ['01', 'COMMUNITY'], ['02', 'MENTORSHIP'], ['03', 'PROOF OF WORK'], ['04', 'C·FLOW READY'],
            ].map(([number, label], index) => (
              <ScrollReveal key={number} delay={index * 70}>
                <div className="p-5 sm:p-6 min-h-[105px] border-b-2 md:border-b-0 md:border-r-2 last:border-r-0 border-outline-variant bg-surface">
                  <div className="dc-mono text-[10px] mb-4">{number}</div>
                  <div className="font-bold text-sm tracking-tight">{label}</div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <Marquee items={marqueeItems} />

      <section className="max-w-[1500px] mx-auto px-5 sm:px-8 lg:px-12 py-24 sm:py-32" data-gsap-reveal>
        <ScrollReveal>
          <div className="grid lg:grid-cols-[0.3fr_1.7fr] gap-8 lg:gap-16">
            <div className="dc-mono text-xs uppercase tracking-[0.2em]">[ 01 / THE PROBLEM ]</div>
            <div>
              <h2 className="dc-display text-5xl sm:text-6xl lg:text-8xl max-w-5xl">Learning is static. <span className="text-primary">Building isn't.</span></h2>
              <p className="mt-10 max-w-2xl text-lg leading-relaxed text-on-surface-variant">Tutorials can tell you what to learn. DevCollective helps you turn that knowledge into projects, conversations, feedback, contributions, and a visible body of work.</p>
              <div className="mt-10 flex flex-wrap gap-2 dc-mono text-[9px] uppercase tracking-[0.12em]">
                <span className="border-2 border-outline-variant bg-dc-yellow px-3 py-2">SKILL → PROJECT</span>
                <span className="border-2 border-outline-variant bg-dc-mint px-3 py-2">PROJECT → FEEDBACK</span>
                <span className="border-2 border-outline-variant bg-dc-lavender px-3 py-2">FEEDBACK → SHIP</span>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      <Marquee items={['SHIP SOMETHING', 'GET FEEDBACK', 'ITERATE', 'HELP SOMEONE', 'LEVEL UP', 'REPEAT']} reverse className="bg-secondary-container" />

      <section className="border-y-2 border-outline-variant bg-surface-container-lowest" data-gsap-reveal>
        <div className="max-w-[1500px] mx-auto px-5 sm:px-8 lg:px-12 py-24 sm:py-32">
          <ScrollReveal>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
              <div><p className="dc-mono text-xs uppercase tracking-[0.2em] mb-4">[ 02 / THE SYSTEM ]</p><h2 className="dc-display text-5xl sm:text-6xl lg:text-7xl">One ecosystem.<br /><span className="text-primary">Many ways to grow.</span></h2></div>
              <p className="dc-mono text-[10px] uppercase tracking-[0.15em] text-on-surface-variant max-w-xs">Every module feeds the same loop: learn, build, collaborate, ship.</p>
            </div>
          </ScrollReveal>
          <div className="grid md:grid-cols-2 border-t-2 border-l-2 border-outline-variant">
            {modules.map((module, index) => {
              const Icon = module.icon;
              return (
                <ScrollReveal key={module.number} delay={index * 80} className="h-full">
                  <button onClick={() => setActiveTab(module.action)} className="group relative w-full h-full min-h-[330px] text-left border-r-2 border-b-2 border-outline-variant p-7 sm:p-9 bg-background hover:bg-surface">
                    <div className="flex items-start justify-between gap-5"><span className="dc-mono text-xs text-on-surface-variant">{module.number}</span><span className={`w-12 h-12 flex items-center justify-center border-2 border-outline-variant ${module.tone} dc-hard-shadow-sm`}><Icon className="w-5 h-5" /></span></div>
                    <div className="mt-16 sm:mt-20 flex items-end justify-between gap-8"><div><h3 className="dc-display text-4xl sm:text-5xl mb-4 group-hover:text-primary">{module.title}</h3><p className="text-sm sm:text-base leading-relaxed text-on-surface-variant max-w-md">{module.description}</p></div><ArrowDownRight className="w-7 h-7 shrink-0 group-hover:translate-x-1 group-hover:translate-y-1 transition-transform" /></div>
                  </button>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className="max-w-[1500px] mx-auto px-5 sm:px-8 lg:px-12 py-24 sm:py-32" data-gsap-reveal>
        <ScrollReveal>
          <div className="border-2 border-outline-variant bg-dc-yellow p-7 sm:p-10 lg:p-14 dc-hard-shadow">
            <div className="grid lg:grid-cols-[0.6fr_1.4fr] gap-12 items-start">
              <div><p className="dc-mono text-xs uppercase tracking-[0.2em] mb-5">[ 03 / THE LOOP ]</p><h2 className="dc-display text-5xl sm:text-6xl lg:text-7xl">Learn.<br />Build.<br />Collaborate.<br />Ship.</h2></div>
              <div className="grid sm:grid-cols-4 border-2 border-outline-variant">
                {[{ n: '01', title: 'LEARN', text: 'Find the next skill.' }, { n: '02', title: 'BUILD', text: 'Turn it into proof.' }, { n: '03', title: 'COLLABORATE', text: 'Get feedback and help.' }, { n: '04', title: 'SHIP', text: 'Finish what you started.' }].map((step, index) => (
                  <div key={step.n} className={`p-6 sm:p-7 bg-[#FFF9F0] ${index < 3 ? 'border-b-2 sm:border-b-0 sm:border-r-2' : ''} border-outline-variant`}>
                    <span className="dc-mono text-[10px]">{step.n}</span><h3 className="dc-display text-3xl mt-12 mb-3">{step.title}</h3><p className="text-sm text-on-surface-variant leading-relaxed">{step.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      <section className="border-y-2 border-outline-variant bg-dc-lavender" data-gsap-reveal>
        <div className="max-w-[1500px] mx-auto px-5 sm:px-8 lg:px-12 py-20 sm:py-24">
          <ScrollReveal>
            <div className="grid lg:grid-cols-[1fr_auto] gap-10 items-center">
              <div>
                <div className="flex items-center gap-3 dc-mono text-xs uppercase tracking-[0.2em] mb-5"><Terminal className="w-4 h-4" />04 / C·FLOW — VISUAL EXECUTION</div>
                <h2 className="dc-display text-5xl sm:text-6xl lg:text-8xl text-[#171717] max-w-5xl">Understand the flow.<br /><span className="text-primary">See the execution.</span></h2>
                <p className="mt-6 max-w-3xl text-base sm:text-lg leading-relaxed text-[#171717]/75">C·FLOW turns C and C++ code into a visual execution experience. Parse the program, follow control flow, inspect state changes, and understand what happens step by step instead of reading a wall of code and guessing.</p>
                <div className="mt-8 grid sm:grid-cols-3 gap-3">
                  {[{ n: '01', title: 'PARSE', text: 'Read the structure of your C/C++ program.' }, { n: '02', title: 'EXECUTE', text: 'Follow statements and state changes step by step.' }, { n: '03', title: 'VISUALIZE', text: 'See control flow, loops, branches, and execution state.' }].map((item) => (
                    <div key={item.n} className="border-2 border-[#171717] bg-[#FFF9F0] p-5 sm:p-6">
                      <span className="dc-mono text-[10px]">{item.n}</span>
                      <h3 className="dc-display text-2xl sm:text-3xl mt-8 mb-2">{item.title}</h3>
                      <p className="text-sm leading-relaxed text-[#171717]/70">{item.text}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <a href={CFLOW_LANDING_URL} target="_blank" rel="noreferrer" className="dc-hard-shadow-sm inline-flex items-center gap-3 px-6 py-4 bg-[#171717] text-[#FFF9F0] border-2 border-[#171717] font-bold uppercase tracking-wide">Open C·FLOW <ArrowRight className="w-4 h-4" /></a>
                  <span className="dc-mono text-[9px] uppercase tracking-[0.14em] text-[#171717]/60">Dedicated visual execution environment</span>
                </div>
              </div>
              <div className="border-2 border-[#171717] bg-[#FFF9F0] p-6 sm:p-8 dc-hard-shadow-sm min-w-[250px]">
                <div className="flex items-start justify-between gap-4"><SystemSignal /><Activity className="w-5 h-5" /></div>
                <div className="dc-mono text-[10px] uppercase tracking-[0.16em] mt-7">Integration status</div>
                <div className="dc-display text-4xl mt-2">LIVE / READY</div>
                <div className="mt-5 border-t-2 border-[#171717] pt-4 dc-mono text-[9px] uppercase leading-relaxed">C·FLOW / VISUAL EXECUTION<br />DEVCO / COMMUNITY LAYER</div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section className="max-w-[1500px] mx-auto px-5 sm:px-8 lg:px-12 py-24 sm:py-36" data-gsap-reveal>
        <ScrollReveal>
          <div className="text-center">
            <p className="dc-mono text-xs uppercase tracking-[0.22em] mb-6">[ 05 / YOUR TURN ]</p>
            <h2 className="dc-display text-[clamp(4rem,10vw,9rem)]">MAKE SOMETHING.<br /><span className="text-primary">SHIP IT.</span></h2>
            <p className="max-w-xl mx-auto mt-8 text-lg text-on-surface-variant leading-relaxed">Your next project, mentor, roadmap, and collaborator are closer than you think.</p>
            <div className="mt-9 flex justify-center gap-3 flex-wrap"><button onClick={() => setActiveTab('register')} className="dc-hard-shadow inline-flex items-center gap-3 px-8 py-4 bg-primary text-on-primary border-2 border-outline-variant font-bold uppercase tracking-wide">Join DevCollective <ArrowRight className="w-4 h-4" /></button><button onClick={() => setActiveTab('roadmap')} className="inline-flex items-center gap-3 px-8 py-4 bg-surface border-2 border-outline-variant font-bold uppercase tracking-wide">Explore roadmap</button></div>
          </div>
        </ScrollReveal>
      </section>

      <footer className="border-t-2 border-outline-variant px-5 sm:px-8 lg:px-12 py-8 max-w-[1500px] mx-auto flex flex-col sm:flex-row gap-4 justify-between dc-mono text-[10px] uppercase tracking-[0.15em] text-on-surface-variant"><span>DEV_COLLECTIVE / 2026</span><span>LEARN. BUILD. COLLABORATE. SHIP.</span></footer>
    </div>
  );
};
