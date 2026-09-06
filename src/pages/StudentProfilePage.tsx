import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Flame, Github, Linkedin, Pencil, Compass, ArrowRight } from 'lucide-react';

export const StudentProfilePage: React.FC = () => {
  const { user, setActiveTab } = useAuth();
  if (!user) return null;

  const display = (value: string | undefined, empty = 'Not set') => value?.trim() || empty;
  const interests = user.selectedDomains || [];

  return (
    <div className="space-y-8 pb-16">
      <section className="relative overflow-hidden border-2 border-outline-variant bg-surface shadow-[7px_7px_0_#171717]">
        <div className="h-40 md:h-52 bg-[linear-gradient(135deg,var(--dc-blue),var(--dc-lavender),var(--dc-mint))] border-b-2 border-outline-variant" />
        <div className="p-6 md:p-8 -mt-14 relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 text-center sm:text-left">
            <div className="w-28 h-28 sm:w-32 sm:h-32 border-2 border-outline-variant bg-surface-container flex items-center justify-center overflow-hidden shadow-[4px_4px_0_#171717]">
              {user.avatar ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" /> : <span className="font-label-mono text-3xl font-bold">{user.name.slice(0, 1).toUpperCase()}</span>}
            </div>
            <div className="space-y-2">
              <p className="font-label-mono text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">PROFILE / {user.role.toUpperCase()}</p>
              <h2 className="dc-display text-4xl sm:text-5xl">{display(user.name)}</h2>
              <p className="font-label-mono text-xs uppercase text-primary font-bold">{display(user.college)} · {display(user.branch)} · {display(user.academicYear)}</p>
              <p className="text-sm text-on-surface-variant max-w-2xl leading-relaxed">{display(user.bio, 'Your bio will appear here once you add it.')}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button onClick={() => setActiveTab('profile-setup')} className="flex items-center gap-2 px-4 py-3 bg-primary text-on-primary border-2 border-outline-variant shadow-[4px_4px_0_#171717] font-label-mono text-[10px] uppercase font-bold"><Pencil className="w-4 h-4" /> Edit Profile</button>
            {user.githubUrl && <a href={user.githubUrl} target="_blank" rel="noreferrer" className="p-3 bg-surface border-2 border-outline-variant"><Github className="w-5 h-5" /></a>}
            {user.linkedinUrl && <a href={user.linkedinUrl} target="_blank" rel="noreferrer" className="p-3 bg-surface border-2 border-outline-variant"><Linkedin className="w-5 h-5" /></a>}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[['LEVEL', String(user.level)], ['REP', user.rep.toLocaleString()], ['STREAK', `${user.streakDays}d`], ['ROLE', user.role.toUpperCase()]].map(([label, value]) => (
          <div key={label} className="border-2 border-outline-variant bg-surface p-5 shadow-[4px_4px_0_#171717]">
            <span className="font-label-mono text-[10px] uppercase text-on-surface-variant block">{label}</span>
            <span className="dc-display text-3xl mt-2 block">{value}{label === 'STREAK' && <Flame className="inline w-5 h-5 ml-1" />}</span>
          </div>
        ))}
      </section>

      <section className="border-2 border-outline-variant bg-surface p-6 md:p-8 shadow-[5px_5px_0_#171717]">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b-2 border-outline-variant pb-4 mb-6">
          <div className="flex items-start gap-3"><div className="w-10 h-10 border-2 border-outline-variant bg-dc-lavender flex items-center justify-center"><Compass className="w-5 h-5" /></div><div><p className="font-label-mono text-[10px] uppercase text-on-surface-variant">DISCOVERY / PATH SIGNAL</p><h3 className="dc-display text-3xl mt-1">INTERESTED IN</h3></div></div>
          <button onClick={() => setActiveTab('choose-path')} className="font-label-mono text-[10px] uppercase tracking-[0.12em] text-primary inline-flex items-center gap-2">Edit paths <ArrowRight className="w-3.5 h-3.5" /></button>
        </div>
        {interests.length ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {interests.map((interest, index) => (
              <div key={interest} className="border-2 border-outline-variant bg-surface-container-low p-4 flex items-center gap-3">
                <span className="w-8 h-8 border-2 border-outline-variant bg-dc-blue flex items-center justify-center font-label-mono text-[10px] font-bold">0{index + 1}</span>
                <div><p className="font-bold text-sm">{interest}</p><p className="font-label-mono text-[9px] uppercase text-on-surface-variant mt-1">Learning path selected</p></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="border-2 border-dashed border-outline-variant p-6 text-center"><p className="font-label-mono text-xs uppercase text-on-surface-variant">NO PATHS SELECTED</p><button onClick={() => setActiveTab('choose-path')} className="mt-3 text-sm font-bold text-primary">Choose your path →</button></div>
        )}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border-2 border-outline-variant bg-surface p-6 md:p-8 shadow-[5px_5px_0_#171717]">
          <div className="flex items-end justify-between border-b-2 border-outline-variant pb-4 mb-5">
            <div><p className="font-label-mono text-[10px] uppercase text-on-surface-variant">DATA / SKILLS</p><h3 className="dc-display text-3xl mt-1">TECH STACK</h3></div>
            <span className="font-label-mono text-[10px]">{user.skills.length} ITEMS</span>
          </div>
          {user.skills.length ? <div className="flex flex-wrap gap-2">{user.skills.map((skill) => <span key={skill} className="px-3 py-2 bg-dc-blue border-2 border-outline-variant font-label-mono text-[10px] uppercase">{skill}</span>)}</div> : <p className="font-label-mono text-xs text-on-surface-variant">NO SKILLS ADDED YET.</p>}
        </div>

        <div className="border-2 border-outline-variant bg-surface p-6 md:p-8 shadow-[5px_5px_0_#171717]">
          <div className="border-b-2 border-outline-variant pb-4 mb-5"><p className="font-label-mono text-[10px] uppercase text-on-surface-variant">DATA / LINKS</p><h3 className="dc-display text-3xl mt-1">IDENTITY</h3></div>
          <div className="space-y-4 font-label-mono text-xs">
            <div className="flex justify-between gap-4 border-b border-outline-variant/40 pb-3"><span className="text-on-surface-variant">EMAIL</span><span className="text-right break-all">{user.email}</span></div>
            <div className="flex justify-between gap-4 border-b border-outline-variant/40 pb-3"><span className="text-on-surface-variant">GITHUB</span><span className="text-right break-all">{display(user.githubUrl)}</span></div>
            <div className="flex justify-between gap-4"><span className="text-on-surface-variant">LINKEDIN</span><span className="text-right break-all">{display(user.linkedinUrl)}</span></div>
          </div>
        </div>
      </section>

      <section className="border-2 border-outline-variant bg-surface p-6 md:p-8 shadow-[5px_5px_0_#171717]">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b-2 border-outline-variant pb-4 mb-6">
          <div><p className="font-label-mono text-[10px] uppercase text-on-surface-variant">ACTIVITY / LIVE DATA</p><h3 className="dc-display text-3xl">STARTING POINT</h3></div>
          <span className="font-label-mono text-[10px] uppercase bg-dc-mint border-2 border-outline-variant px-2 py-1">0 CONTRIBUTIONS</span>
        </div>
        <p className="text-sm text-on-surface-variant">Your activity, achievements, projects, and learning history will appear here as you use DevCollective. Nothing is pre-populated.</p>
      </section>
    </div>
  );
};
