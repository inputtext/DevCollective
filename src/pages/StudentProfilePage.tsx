import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Flame,
  Award,
  Zap,
  Globe,
  Github,
  Linkedin,
  Code,
  CheckCircle2,
  ExternalLink,
  Lock,
} from 'lucide-react';

export const StudentProfilePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-10 pb-16">
      {/* Banner & Headshot Header */}
      <section className="relative w-full rounded-2xl overflow-hidden border-2 border-outline-variant bg-surface-container-low">
        <div className="h-48 md:h-64 w-full bg-gradient-to-r from-primary-container via-inverse-primary to-secondary-container opacity-90 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/10 to-transparent" />
        </div>

        <div className="p-6 md:p-8 -mt-16 sm:-mt-20 relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 text-center sm:text-left">
            <img
              src={
                user?.avatar ||
                'https://lh3.googleusercontent.com/aida-public/AB6AXuAoACwcivsiMbHH0a_RxINe7Ny_2s2FDDkCw2JWclPgXtJ8fz7Uttp54ejROeQZK800BxfBZ3--Os12blJYDlMW-3NWK3w6pw-IavFJGZ9nVxMmPTgkAfg5mHcurV6LU5BTMYzBBixPeKiSdCMJgGAmP0AkI18uS1NazoB0ZCwNPCYVCwS4NVFKnTGiPHSsp_QLsf6XES7XfY76G_VmAfFQQjmtlNSSkBTCh6uMJBfZSbVZ4q5v_SaYjCBR1p3HFKK6By1AalBNtiM'
              }
              alt={user?.name}
              className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl border-4 border-surface bg-surface-container object-cover shadow-2xl"
            />

            <div className="space-y-1">
              <h2 className="font-headline-lg text-2xl sm:text-3xl font-extrabold text-white">
                {user?.name || 'Alex Rivera'}
              </h2>
              <p className="font-label-mono text-xs text-primary font-bold uppercase">
                {user?.college || 'Stanford CS'} • {user?.branch || 'Computer Science'} ({user?.academicYear || 'Third Year'})
              </p>
              <p className="text-xs text-on-surface-variant max-w-lg leading-relaxed pt-1">
                {user?.bio || 'Building AI solutions one project at a time.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {user?.githubUrl && (
              <a
                href={user.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="p-3 bg-surface-container border-2 border-outline-variant hover:border-primary rounded-xl text-white transition-all"
              >
                <Github className="w-5 h-5" />
              </a>
            )}
            {user?.linkedinUrl && (
              <a
                href={user.linkedinUrl}
                target="_blank"
                rel="noreferrer"
                className="p-3 bg-surface-container border-2 border-outline-variant hover:border-primary rounded-xl text-white transition-all"
              >
                <Linkedin className="w-5 h-5" />
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Developer Metrics Row */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-surface-container border-2 border-outline-variant p-5 rounded-2xl text-center space-y-1">
          <span className="font-label-mono text-[10px] text-outline uppercase block">Level</span>
          <span className="text-3xl font-bold text-primary">{user?.level || 18}</span>
        </div>
        <div className="bg-surface-container border-2 border-outline-variant p-5 rounded-2xl text-center space-y-1">
          <span className="font-label-mono text-[10px] text-outline uppercase block">Reputation</span>
          <span className="text-3xl font-bold text-tertiary">
            {(user?.rep || 2450).toLocaleString()}
          </span>
        </div>
        <div className="bg-surface-container border-2 border-outline-variant p-5 rounded-2xl text-center space-y-1">
          <span className="font-label-mono text-[10px] text-outline uppercase block">Streak</span>
          <span className="text-3xl font-bold text-error flex items-center justify-center gap-1">
            {user?.streakDays || 42}d <Flame className="w-5 h-5 fill-error" />
          </span>
        </div>
        <div className="bg-surface-container border-2 border-outline-variant p-5 rounded-2xl text-center space-y-1">
          <span className="font-label-mono text-[10px] text-outline uppercase block">Global Rank</span>
          <span className="text-3xl font-bold text-white">#42</span>
        </div>
      </section>

      {/* Consistency Heatmap (GitHub Style) */}
      <section className="bg-surface-container border-2 border-outline-variant p-6 sm:p-8 rounded-2xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-headline-md text-xl font-bold text-white">Consistency Engine</h3>
            <p className="text-xs text-on-surface-variant font-label-mono">
              245 Code & Learning Contributions in 2024
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-label-mono text-outline">
            <span>Less</span>
            <div className="w-3 h-3 bg-surface-container-highest rounded-sm" />
            <div className="w-3 h-3 bg-tertiary/30 rounded-sm" />
            <div className="w-3 h-3 bg-tertiary/60 rounded-sm" />
            <div className="w-3 h-3 bg-tertiary rounded-sm" />
            <span>More</span>
          </div>
        </div>

        <div className="overflow-x-auto pb-2">
          <div className="grid grid-rows-7 grid-flow-col gap-1.5 min-w-[700px]">
            {Array.from({ length: 7 * 28 }).map((_, i) => {
              const intensity = (i * 17) % 5;
              let bg = 'bg-surface-container-highest';
              if (intensity === 1) bg = 'bg-tertiary/20';
              if (intensity === 2) bg = 'bg-tertiary/40';
              if (intensity === 3) bg = 'bg-tertiary/70';
              if (intensity === 4) bg = 'bg-tertiary';

              return (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-sm ${bg} hover:border hover:border-white transition-all`}
                  title={`Activity on day ${i + 1}`}
                />
              );
            })}
          </div>
        </div>
      </section>

      {/* Skills & Roadmaps Row */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Skills */}
        <div className="bg-surface-container border-2 border-outline-variant p-6 sm:p-8 rounded-2xl space-y-6">
          <h3 className="font-headline-md text-xl font-bold text-white">Skills & Stack</h3>
          <div className="flex flex-wrap gap-2">
            {(user?.skills || ['Python', 'TensorFlow', 'React', 'PyTorch', 'AWS', 'Docker', 'C++']).map(
              (skill) => (
                <span
                  key={skill}
                  className="px-3.5 py-1.5 bg-surface-container-lowest border border-outline-variant rounded-xl text-xs font-label-mono text-primary font-bold"
                >
                  {skill}
                </span>
              )
            )}
          </div>

          <div className="space-y-4 pt-2">
            <div>
              <div className="flex justify-between text-xs font-label-mono mb-1">
                <span className="text-white">Python & Deep Learning</span>
                <span className="text-tertiary font-bold">Advanced (85%)</span>
              </div>
              <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                <div className="bg-tertiary h-full rounded-full w-[85%]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-label-mono mb-1">
                <span className="text-white">React & TypeScript</span>
                <span className="text-secondary font-bold">Proficient (70%)</span>
              </div>
              <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                <div className="bg-secondary h-full rounded-full w-[70%]" />
              </div>
            </div>
          </div>
        </div>

        {/* Achievements */}
        <div className="bg-surface-container border-2 border-outline-variant p-6 sm:p-8 rounded-2xl space-y-6">
          <h3 className="font-headline-md text-xl font-bold text-white">Achievements & Badges</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-surface-container-lowest border border-outline-variant rounded-xl text-center space-y-2">
              <div className="w-12 h-12 mx-auto rounded-full bg-tertiary/10 border border-tertiary flex items-center justify-center text-tertiary">
                <Zap className="w-6 h-6" />
              </div>
              <p className="font-label-mono text-[11px] font-bold text-white uppercase">42d Streak</p>
            </div>

            <div className="p-4 bg-surface-container-lowest border border-outline-variant rounded-xl text-center space-y-2">
              <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 border border-primary flex items-center justify-center text-primary">
                <Award className="w-6 h-6" />
              </div>
              <p className="font-label-mono text-[11px] font-bold text-white uppercase">Top 1% Dev</p>
            </div>

            <div className="p-4 bg-surface-container-lowest border border-outline-variant rounded-xl text-center space-y-2">
              <div className="w-12 h-12 mx-auto rounded-full bg-secondary/10 border border-secondary flex items-center justify-center text-secondary">
                <Code className="w-6 h-6" />
              </div>
              <p className="font-label-mono text-[11px] font-bold text-white uppercase">Capstones</p>
            </div>
          </div>
        </div>
      </section>

      {/* Showcased Projects */}
      <section className="space-y-6">
        <h3 className="font-headline-md text-xl font-bold text-white">Showcased Projects</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-surface-container border-2 border-outline-variant rounded-2xl overflow-hidden hover:border-primary transition-all group">
            <div className="h-48 relative overflow-hidden bg-surface-container-lowest">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAKWkQQe91VPBXhYbkApImVLxGtAoywz31reX6PdkZUhLNi--xNKiNXxZ2bs1GWY7ggW3_dRHBv09h4bNxJwt3s69I45YDlXIMXM6fWpJZCnksxMIqrTEXJL2nLLHnUZ7pDzHQne6G0dBKCr2x40PXlZtpL6Qz1UrJDAUvVCg9VnrBgyaQiVGFQfu7FVlKRbtStAEgBOdall9esXCgkhqGvvb1edq3kaC9AWj3QRwyQq7XKxdw2x_WnkCvb9S0NHR7R508BZ9bS5So"
                alt="NeuroScan AI"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="p-6 space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-lg text-white">NeuroScan AI</h4>
                <ExternalLink className="w-4 h-4 text-outline hover:text-white cursor-pointer" />
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Real-time neural pattern recognition platform for diagnostic assistance using TensorFlow and React.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-2">
                <span className="text-[10px] font-label-mono px-2 py-0.5 border border-outline-variant rounded text-tertiary">
                  Python
                </span>
                <span className="text-[10px] font-label-mono px-2 py-0.5 border border-outline-variant rounded text-secondary">
                  TensorFlow
                </span>
                <span className="text-[10px] font-label-mono px-2 py-0.5 border border-outline-variant rounded text-primary">
                  React
                </span>
              </div>
            </div>
          </div>

          <div className="bg-surface-container border-2 border-outline-variant rounded-2xl overflow-hidden hover:border-primary transition-all group">
            <div className="h-48 relative overflow-hidden bg-surface-container-lowest">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBjb0CxvtZonW6W418s_mWK2uIeKC0_k8HqaQV-K0LtgpBqnPrx_ddei-rv9XXYilNN8tWueD7Yu6tRf0pVEbyWdjC9vhidFx4opSu3ki1vFdXwynCQzbhfbiyha8gXL73fcLLPGUo9jdMUHMJYsAfaa6Kqgk5K4wBA-7fdIcbCvTNN2p1K5s2UjClWF9WbETX6ck1LbW1KjAxLigxB-1Y2qw31p14yHe6s7mJGgeexFebaXFM6IJpii54RfxGDjTaMQW0cbyBqjB0"
                alt="EcoSim Engine"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="p-6 space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-lg text-white">EcoSim Engine</h4>
                <ExternalLink className="w-4 h-4 text-outline hover:text-white cursor-pointer" />
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Simulation framework for urban sustainability modeling with interactive 3D visualizations.
              </p>
              <div className="flex flex-wrap gap-1.5 pt-2">
                <span className="text-[10px] font-label-mono px-2 py-0.5 border border-outline-variant rounded text-tertiary">
                  Three.js
                </span>
                <span className="text-[10px] font-label-mono px-2 py-0.5 border border-outline-variant rounded text-secondary">
                  Node.js
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
