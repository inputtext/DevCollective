import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ThreeProcessor } from '../components/ThreeProcessor';
import {
  Users,
  Brain,
  Network,
  GitBranch,
  Trophy,
  Terminal,
  Star,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { setActiveTab } = useAuth();

  return (
    <div className="bg-background text-on-background min-h-screen selection:bg-primary selection:text-on-primary">
      {/* HERO SECTION */}
      <section className="relative pt-12 pb-24 overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-[-100px] right-[-100px] w-[500px] h-[500px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-[-200px] w-[400px] h-[400px] bg-secondary/15 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
          <div className="space-y-8">
            <div className="inline-block px-3.5 py-1 border-2 border-primary text-primary font-label-mono text-xs uppercase tracking-widest rounded-md">
              EST. 2024 // VERSION 1.0 MVP
            </div>

            <h1 className="font-display-2xl text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight text-white tracking-tight">
              Where College Developers <span className="text-primary">Build Their Future</span> Together.
            </h1>

            <p className="font-body-lg text-lg text-on-surface-variant max-w-lg leading-relaxed">
              Connecting student engineers with elite mentors, global hackathons, and a gamified reputation ecosystem. Forge your career architecture before you graduate.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <button
                onClick={() => setActiveTab('login')}
                className="px-8 py-4 bg-gradient-to-r from-primary-container to-secondary-container text-white font-bold rounded-xl shadow-[0_6px_0_0_#1d00a5] hover:shadow-[0_2px_0_0_#1d00a5] hover:translate-y-1 transition-all active:scale-95"
              >
                Login Now
              </button>
              <button
                onClick={() => setActiveTab('register')}
                className="px-8 py-4 bg-surface-container border-2 border-outline-variant text-on-surface font-bold rounded-xl hover:bg-surface-container-highest transition-all active:scale-95"
              >
                Register
              </button>
              <button
                onClick={() => setActiveTab('roadmap')}
                className="px-6 py-4 border-2 border-transparent text-primary font-label-mono text-xs uppercase tracking-widest underline decoration-2 underline-offset-8 hover:text-white transition-colors"
              >
                Explore Roadmaps
              </button>
            </div>
          </div>

          {/* 3D Interactive Canvas & Overlays */}
          <div className="relative h-[480px] sm:h-[550px] w-full">
            <div className="absolute inset-0 bg-surface-container-lowest/60 rounded-3xl border-2 border-outline-variant overflow-hidden shadow-2xl">
              <ThreeProcessor />

              {/* Floating Glass Badges */}
              <div className="absolute top-6 left-6 p-4 bg-surface-container/90 border-2 border-outline-variant rounded-xl backdrop-blur-md animate-bounce pointer-events-none" style={{ animationDuration: '4s' }}>
                <div className="font-label-mono text-[10px] text-primary uppercase">Reputation Points</div>
                <div className="font-headline-md text-xl font-bold text-white">2,450 REP</div>
              </div>

              <div className="absolute top-1/2 -right-2 transform -translate-y-1/2 p-4 bg-surface-container/90 border-2 border-primary rounded-xl backdrop-blur-md pointer-events-none">
                <div className="font-label-mono text-[10px] text-tertiary uppercase">Active Streak</div>
                <div className="font-headline-md text-xl font-bold text-white">42 DAYS</div>
              </div>

              <div className="absolute bottom-8 left-8 flex flex-wrap gap-3 pointer-events-none">
                <div className="px-4 py-2 bg-surface-container/90 border-2 border-outline-variant rounded-full backdrop-blur-md flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-secondary" />
                  <span className="font-label-mono text-xs uppercase text-white">Level 18</span>
                </div>
                <div className="px-4 py-2 bg-surface-container/90 border-2 border-outline-variant rounded-full backdrop-blur-md flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-tertiary" />
                  <span className="font-label-mono text-xs uppercase text-white">Mentor Verified</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="py-20 bg-surface-container-lowest border-y-2 border-outline-variant">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="mb-14">
            <h2 className="font-headline-lg text-3xl sm:text-4xl font-bold text-white mb-2">Ecosystem Modules</h2>
            <p className="font-label-mono text-xs uppercase tracking-[0.2em] text-primary">
              High-performance tools for student developer growth
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div
              onClick={() => setActiveTab('community')}
              className="p-8 bg-surface-container border-2 border-outline-variant rounded-[24px] hover:translate-y-[-4px] hover:shadow-[6px_6px_0px_0px_#4F46E5] transition-all cursor-pointer group"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary-container/20 flex items-center justify-center mb-6 group-hover:bg-primary-container transition-colors">
                <Users className="w-7 h-7 text-primary group-hover:text-white" />
              </div>
              <h3 className="font-headline-md text-2xl font-bold text-white mb-3">Coding Community</h3>
              <p className="text-on-surface-variant font-body-md text-sm leading-relaxed">
                Connect with thousands of student developers across every tech stack imaginable.
              </p>
            </div>

            <div
              onClick={() => setActiveTab('mentors')}
              className="p-8 bg-surface-container border-2 border-outline-variant rounded-[24px] hover:translate-y-[-4px] hover:shadow-[6px_6px_0px_0px_#06B6D4] transition-all cursor-pointer group"
            >
              <div className="w-14 h-14 rounded-2xl bg-secondary-container/20 flex items-center justify-center mb-6 group-hover:bg-secondary-container transition-colors">
                <Brain className="w-7 h-7 text-secondary group-hover:text-white" />
              </div>
              <h3 className="font-headline-md text-2xl font-bold text-white mb-3">Senior Mentorship</h3>
              <p className="text-on-surface-variant font-body-md text-sm leading-relaxed">
                Get direct guidance from seniors and industry professionals who've walked your path.
              </p>
            </div>

            <div
              onClick={() => setActiveTab('community')}
              className="p-8 bg-surface-container border-2 border-outline-variant rounded-[24px] hover:translate-y-[-4px] hover:shadow-[6px_6px_0px_0px_#22C55E] transition-all cursor-pointer group"
            >
              <div className="w-14 h-14 rounded-2xl bg-tertiary-container/20 flex items-center justify-center mb-6 group-hover:bg-tertiary-container transition-colors">
                <Network className="w-7 h-7 text-tertiary group-hover:text-white" />
              </div>
              <h3 className="font-headline-md text-2xl font-bold text-white mb-3">Project Collaboration</h3>
              <p className="text-on-surface-variant font-body-md text-sm leading-relaxed">
                Find your co-founders or join existing open-source projects to build real-world experience.
              </p>
            </div>

            <div
              onClick={() => setActiveTab('roadmap')}
              className="p-8 bg-surface-container border-2 border-outline-variant rounded-[24px] hover:translate-y-[-4px] hover:shadow-[6px_6px_0px_0px_#4F46E5] transition-all cursor-pointer group"
            >
              <div className="w-14 h-14 rounded-2xl bg-surface-container-highest flex items-center justify-center mb-6">
                <GitBranch className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-headline-md text-2xl font-bold text-white mb-3">Roadmaps</h3>
              <p className="text-on-surface-variant font-body-md text-sm leading-relaxed">
                Structured, community-vetted paths from beginner to production-ready architect.
              </p>
            </div>

            <div
              onClick={() => setActiveTab('leaderboard')}
              className="p-8 bg-surface-container border-2 border-outline-variant rounded-[24px] hover:translate-y-[-4px] hover:shadow-[6px_6px_0px_0px_#06B6D4] transition-all cursor-pointer group"
            >
              <div className="w-14 h-14 rounded-2xl bg-surface-container-highest flex items-center justify-center mb-6">
                <Trophy className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-headline-md text-2xl font-bold text-white mb-3">Leaderboards</h3>
              <p className="text-on-surface-variant font-body-md text-sm leading-relaxed">
                Climb the ranks by contributing, mentoring, and solving complex architecture challenges.
              </p>
            </div>

            <div
              onClick={() => setActiveTab('community')}
              className="p-8 bg-surface-container border-2 border-outline-variant rounded-[24px] hover:translate-y-[-4px] hover:shadow-[6px_6px_0px_0px_#22C55E] transition-all cursor-pointer group"
            >
              <div className="w-14 h-14 rounded-2xl bg-surface-container-highest flex items-center justify-center mb-6">
                <Terminal className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-headline-md text-2xl font-bold text-white mb-3">Events & Hackathons</h3>
              <p className="text-on-surface-variant font-body-md text-sm leading-relaxed">
                Exclusive community sprints and global hackathons with high-tier tech rewards.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ROADMAP CAREER PATH SECTION */}
      <section className="py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="text-center mb-16">
            <h2 className="font-headline-lg text-3xl sm:text-4xl font-bold text-white mb-2">Architect Career Path</h2>
            <p className="font-label-mono text-xs uppercase tracking-[0.2em] text-secondary">
              The journey from zero to mentor
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 text-center">
            {[
              { num: '01', title: 'Beginner', sub: 'Onboarding' },
              { num: '02', title: 'Fundamentals', sub: 'Core Skills' },
              { num: '03', title: 'Build Projects', sub: 'Current Phase', highlight: true },
              { num: '04', title: 'Join Teams', sub: 'Scale Up' },
              { num: '05', title: 'Become Mentor', sub: 'Expertise' },
            ].map((step) => (
              <div
                key={step.num}
                onClick={() => setActiveTab('roadmap')}
                className={`p-6 rounded-2xl border-2 transition-all cursor-pointer ${
                  step.highlight
                    ? 'bg-primary-container border-primary shadow-[0_0_20px_rgba(79,70,229,0.5)]'
                    : 'bg-surface-container border-outline-variant hover:border-primary'
                }`}
              >
                <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-4 font-label-mono text-lg font-bold ${
                  step.highlight ? 'bg-white text-primary' : 'bg-surface-container-high text-white'
                }`}>
                  {step.num}
                </div>
                <h4 className="font-headline-md text-lg font-bold text-white mb-1">{step.title}</h4>
                <p className={`font-label-mono text-[11px] uppercase ${step.highlight ? 'text-white' : 'text-on-surface-variant'}`}>
                  {step.sub}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LEADERBOARD PREVIEW */}
      <section className="py-20 bg-surface-container-low border-y-2 border-outline-variant">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-center">
            <div className="lg:col-span-2 space-y-6">
              <h2 className="font-headline-lg text-3xl sm:text-4xl font-bold text-white">Reputation Rankings</h2>
              <p className="font-body-lg text-on-surface-variant text-base leading-relaxed">
                Proof of work is the only currency that matters here. Climb the global leaderboard by shipping code, writing documentation, and helping peers.
              </p>
              <button
                onClick={() => setActiveTab('leaderboard')}
                className="px-8 py-4 bg-transparent border-2 border-primary text-primary font-bold rounded-xl hover:bg-primary/10 transition-all flex items-center gap-3 active:scale-95"
              >
                <span>View Full Leaderboard</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            <div className="lg:col-span-3">
              <div className="bg-surface-container border-2 border-outline-variant rounded-3xl overflow-hidden shadow-2xl">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-surface-container-highest/40 border-b-2 border-outline-variant">
                    <tr className="font-label-mono text-xs uppercase text-on-surface-variant">
                      <th className="p-4 sm:p-6">Rank</th>
                      <th className="p-4 sm:p-6">Developer</th>
                      <th className="p-4 sm:p-6 text-right">Reputation</th>
                      <th className="p-4 sm:p-6 text-right">Level</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y border-outline-variant/30 text-sm">
                    <tr className="hover:bg-surface-container-highest/20 transition-colors">
                      <td className="p-4 sm:p-6">
                        <div className="w-9 h-9 bg-primary/20 text-primary border-2 border-primary rounded-lg flex items-center justify-center font-bold">
                          1
                        </div>
                      </td>
                      <td className="p-4 sm:p-6 flex items-center gap-3">
                        <img
                          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDfOJJp2Cs8Wi6Op4GcxcyVET725RT_Q8wUuV3FVSj1R3jNBjgw3eN7_fl18tPG6WejSXa8chKuFiZ0DtC3aWhjb90dvBCFJdAXt26J6nnp-EJe72xX90RJmgbztF8ckA-XEu9544PeyfHsNcHShzdrXNPfQoe0fCCfvv5UJjiWq0AXtAIgqwKh-hMd4deTOFMTKMEHiBNxDcvzQh5f9S94cP4WQiT9dlc19R7Kq5lcjCyNHcXL5TDKlxLIKO4cBptIABWj4vpcVbI"
                          alt="Kartik"
                          className="w-10 h-10 rounded-full border border-primary object-cover"
                        />
                        <div>
                          <p className="font-bold text-white">Kartik Aryan</p>
                          <p className="text-[11px] text-on-surface-variant font-label-mono uppercase">IIT Bombay</p>
                        </div>
                      </td>
                      <td className="p-4 sm:p-6 text-right font-bold text-primary">6,140 REP</td>
                      <td className="p-4 sm:p-6 text-right font-label-mono text-xs">LVL 28</td>
                    </tr>

                    <tr className="hover:bg-surface-container-highest/20 transition-colors">
                      <td className="p-4 sm:p-6">
                        <div className="w-9 h-9 bg-outline-variant/20 text-white border-2 border-outline-variant rounded-lg flex items-center justify-center font-bold">
                          2
                        </div>
                      </td>
                      <td className="p-4 sm:p-6 flex items-center gap-3">
                        <img
                          src="https://lh3.googleusercontent.com/aida-public/AB6AXuC58uhRruytSCmk0juhyZZUUHYoZKhfMtR9C3-fnhQgvOEkUYUWAaXpP0PW2EgxaSdq6EJAHxty9shW_INl41W8ggn_-pewTUJZg8cyTDckCd-V5_rOItMIKQ9ulECjD2YNyYibvrM6MOPSQdciv6E76vw11FyglNBVER99hUWgpTq-4UQgVuRmzI-UKhrIWOp3epJKg-zCPEDccWz0JOTvzLXZHTVNrtxTPA4LutZIXBISJMV5icvp9DssDh5xA-eseDeBvf37_9Q"
                          alt="Sanya"
                          className="w-10 h-10 rounded-full border border-outline object-cover"
                        />
                        <div>
                          <p className="font-bold text-white">Sanya Verma</p>
                          <p className="text-[11px] text-on-surface-variant font-label-mono uppercase">MIT</p>
                        </div>
                      </td>
                      <td className="p-4 sm:p-6 text-right font-bold text-white">4,820 REP</td>
                      <td className="p-4 sm:p-6 text-right font-label-mono text-xs">LVL 24</td>
                    </tr>

                    <tr className="hover:bg-surface-container-highest/20 transition-colors">
                      <td className="p-4 sm:p-6">
                        <div className="w-9 h-9 bg-outline-variant/20 text-white border-2 border-outline-variant rounded-lg flex items-center justify-center font-bold">
                          3
                        </div>
                      </td>
                      <td className="p-4 sm:p-6 flex items-center gap-3">
                        <img
                          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBHm69iFZgN81K30IaUsptMAMNCtuNZRNylDjyeIu3Ux6dYRvqte98DaJGiCt82n2oPEJcolLc1cg5_77DLFQkft0S95E753SOc8ucXGD2is0XjYr7vJABnyxMS47sWMAhxdGBe26SWwWV-A-YrqiYVtBQGwy3TflnTlKOqcPKIobzT3IogYx7vTKRm88paqp5j0LdYvZ-_DY1yZyHZbm8dXqW4Xp9y17C9FlXtgcPFiRClGKmWEqWAdn318LCGsfQ3th3G3n3PV8A"
                          alt="Rohan"
                          className="w-10 h-10 rounded-full border border-outline object-cover"
                        />
                        <div>
                          <p className="font-bold text-white">Rohan Das</p>
                          <p className="text-[11px] text-on-surface-variant font-label-mono uppercase">Georgia Tech</p>
                        </div>
                      </td>
                      <td className="p-4 sm:p-6 text-right font-bold text-white">4,210 REP</td>
                      <td className="p-4 sm:p-6 text-right font-label-mono text-xs">LVL 21</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="text-center mb-16">
            <h2 className="font-headline-lg text-3xl sm:text-4xl font-bold text-white mb-2">Voices from the Field</h2>
            <p className="font-label-mono text-xs uppercase tracking-[0.2em] text-tertiary">
              Verified student success stories
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 bg-surface-container border-2 border-outline-variant rounded-3xl relative">
              <div className="flex gap-1 mb-6 text-tertiary">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-tertiary text-tertiary" />
                ))}
              </div>
              <p className="font-body-md text-on-surface italic mb-8 leading-relaxed">
                "The community here is insane. I found my first production co-founder within three weeks of joining. The REP system actually means something to recruiters."
              </p>
              <div className="flex items-center gap-4">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAoACwcivsiMbHH0a_RxINe7Ny_2s2FDDkCw2JWclPgXtJ8fz7Uttp54ejROeQZK800BxfBZ3--Os12blJYDlMW-3NWK3w6pw-IavFJGZ9nVxMmPTgkAfg5mHcurV6LU5BTMYzBBixPeKiSdCMJgGAmP0AkI18uS1NazoB0ZCwNPCYVCwS4NVFKnTGiPHSsp_QLsf6XES7XfY76G_VmAfFQQjmtlNSSkBTCh6uMJBfZSbVZ4q5v_SaYjCBR1p3HFKK6By1AalBNtiM"
                  alt="Alex"
                  className="w-12 h-12 rounded-full border-2 border-primary object-cover"
                />
                <div>
                  <p className="font-bold text-white">Alex Rivera</p>
                  <p className="text-xs text-on-surface-variant font-label-mono uppercase">Stanford CS '25</p>
                </div>
              </div>
            </div>

            <div className="p-8 bg-surface-container border-2 border-outline-variant rounded-3xl relative">
              <div className="flex gap-1 mb-6 text-tertiary">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-tertiary text-tertiary" />
                ))}
              </div>
              <p className="font-body-md text-on-surface italic mb-8 leading-relaxed">
                "Getting mentored by seniors who already have jobs at Stripe and Apple was a game-changer. My GitHub looks 10x better than it did last year."
              </p>
              <div className="flex items-center gap-4">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuC58uhRruytSCmk0juhyZZUUHYoZKhfMtR9C3-fnhQgvOEkUYUWAaXpP0PW2EgxaSdq6EJAHxty9shW_INl41W8ggn_-pewTUJZg8cyTDckCd-V5_rOItMIKQ9ulECjD2YNyYibvrM6MOPSQdciv6E76vw11FyglNBVER99hUWgpTq-4UQgVuRmzI-UKhrIWOp3epJKg-zCPEDccWz0JOTvzLXZHTVNrtxTPA4LutZIXBISJMV5icvp9DssDh5xA-eseDeBvf37_9Q"
                  alt="Sarah"
                  className="w-12 h-12 rounded-full border-2 border-secondary object-cover"
                />
                <div>
                  <p className="font-bold text-white">Sanya Verma</p>
                  <p className="text-xs text-on-surface-variant font-label-mono uppercase">MIT Math/CS '24</p>
                </div>
              </div>
            </div>

            <div className="p-8 bg-surface-container border-2 border-outline-variant rounded-3xl relative">
              <div className="flex gap-1 mb-6 text-tertiary">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-tertiary text-tertiary" />
                ))}
              </div>
              <p className="font-body-md text-on-surface italic mb-8 leading-relaxed">
                "The hackathons are where the real growth happens. High stakes, real projects, and a level of competition that makes you stay up all night coding."
              </p>
              <div className="flex items-center gap-4">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBHm69iFZgN81K30IaUsptMAMNCtuNZRNylDjyeIu3Ux6dYRvqte98DaJGiCt82n2oPEJcolLc1cg5_77DLFQkft0S95E753SOc8ucXGD2is0XjYr7vJABnyxMS47sWMAhxdGBe26SWwWV-A-YrqiYVtBQGwy3TflnTlKOqcPKIobzT3IogYx7vTKRm88paqp5j0LdYvZ-_DY1yZyHZbm8dXqW4Xp9y17C9FlXtgcPFiRClGKmWEqWAdn318LCGsfQ3th3G3n3PV8A"
                  alt="Rohan"
                  className="w-12 h-12 rounded-full border-2 border-tertiary object-cover"
                />
                <div>
                  <p className="font-bold text-white">Rohan Das</p>
                  <p className="text-xs text-on-surface-variant font-label-mono uppercase">Georgia Tech '26</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-20 bg-primary-container relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 text-center relative z-10">
          <h2 className="font-display-2xl text-4xl sm:text-5xl lg:text-6xl text-white mb-6 tracking-tight font-extrabold">
            Ready to Deploy Your Project?
          </h2>
          <p className="font-body-lg text-on-primary-container mb-10 max-w-2xl mx-auto text-lg">
            Join 5,000+ student developers. Build your reputation, build your network, and build the future of software.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-5">
            <button
              onClick={() => setActiveTab('register')}
              className="px-10 py-5 bg-white text-primary-container font-bold rounded-2xl shadow-[0_6px_0_0_#dad7ff] hover:shadow-[0_2px_0_0_#dad7ff] hover:translate-y-1 transition-all text-lg active:scale-95"
            >
              Get Started Free
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className="px-10 py-5 border-2 border-white text-white font-bold rounded-2xl hover:bg-white/10 transition-all text-lg active:scale-95"
            >
              Launch Mission Control
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-surface-container-lowest border-t-2 border-outline-variant w-full py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex flex-col items-center sm:items-start">
            <div className="font-headline-md text-xl text-white font-bold tracking-tighter mb-1">
              DEV_COLLECTIVE
            </div>
            <div className="font-label-mono text-xs uppercase text-on-surface-variant">
              © 2024 DEV_COLLECTIVE. ENGINEERED FOR STUDENT ARCHITECTS.
            </div>
          </div>
          <div className="flex flex-wrap gap-6 font-label-mono text-xs uppercase text-on-surface-variant">
            <button onClick={() => setActiveTab('community')} className="hover:text-primary transition-colors">
              COMMUNITY
            </button>
            <button onClick={() => setActiveTab('roadmap')} className="hover:text-primary transition-colors">
              ROADMAPS
            </button>
            <button onClick={() => setActiveTab('leaderboard')} className="hover:text-primary transition-colors">
              LEADERBOARD
            </button>
            <button onClick={() => setActiveTab('admin')} className="hover:text-primary transition-colors">
              ADMIN
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
