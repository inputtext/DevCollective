import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, CalendarDays, ChevronLeft, Clock3, ExternalLink, MapPin, Shirt, Users, ShieldCheck } from 'lucide-react';
import type { DevEvent } from '../types';

const API = `${String(import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '')}/functions/v1/events`;

const fallbackEvents: DevEvent[] = [
  {
    id: 'tedx-ghrcemn-2026', slug: 'tedx-ghrcemn-2026', title: 'TEDxGHRCEMN 2026', subtitle: 'BEYOND THE DOTS',
    description: 'Ideas. Stories. Perspectives. All on one stage. A day filled with thought-provoking talks, new perspectives, meaningful conversations and ideas worth taking beyond the room.',
    startsAt: '2026-09-09T09:00:00+05:30', endsAt: '2026-09-09T18:00:00+05:30',
    venue: 'Eklavya Hall, G H Raisoni College of Engineering and Management', city: 'Nagpur', organizer: 'TEDxGHRCEMN',
    registrationUrl: 'https://konfhub.com/tedxghrcemn-82e1c5a4', sourceUrl: 'https://www.tedxghrcemn.site/',
    ticketInfo: 'Main event passes were listed from ₹399; ticketing and payment were handled by KonfHub.',
    theme: { background: '#050505', foreground: '#FFFFFF', primary: '#E50914', secondary: '#171717', accent: '#FF1A1A' },
    speakers: ['Ajinkya Gandhe', 'Janhvi Singh', 'Sarang Thakre', 'Priyanka Sharma', 'Jayant Khalatkar', 'Himanshu Dusane'],
    coordinators: ['Karan Baghele', 'Khushi Chordiya', 'Faculty Coordinator: Nitin Barsagade'], contactInfo: 'Event enquiries: tedxghrcemn@gmail.com',
    createdAt: '2026-09-01T00:00:00+05:30', updatedAt: '2026-09-15T00:00:00+05:30',
  },
  {
    id: 'shree-ganesh-utsav-2026', slug: 'shree-ganesh-utsav-2026', title: 'Shree Ganesh Utsav Celebration 2026', subtitle: 'DEVOTION · DISCIPLINE · TOGETHERNESS',
    description: 'You are cordially invited to join us for the Shree Ganesh Utsav Celebration 2026 at Shraddha Park, Nagpur. Let us come together to seek the blessings of Lord Ganesha and celebrate this auspicious occasion with devotion, joy and togetherness.',
    startsAt: '2026-09-14T11:00:00+05:30', endsAt: '2026-09-24T18:00:00+05:30',
    venue: 'Shraddha Park', city: 'Nagpur', organizer: 'Team Shree Ganesh Utsav Celebration 2026',
    registrationUrl: null, sourceUrl: null, ticketInfo: 'Main celebration: 15 September 2026 at 10:30 AM. College ID card is compulsory for entry.',
    theme: { background: '#F7F0E5', foreground: '#171717', primary: '#5B169D', secondary: '#EEE2D4', accent: '#F36B21' },
    speakers: [],
    coordinators: ['Dr. Vivek Kapur · Campus Director, Shraddha Park Campus', 'Team Shree Ganesh Utsav Celebration 2026'], contactInfo: 'Shraddha Park, Nagpur',
    createdAt: '2026-09-16T00:00:00+05:30', updatedAt: '2026-09-16T00:00:00+05:30',
  },
];

const statusOf = (event: DevEvent) => Date.now() < new Date(event.startsAt).getTime() ? 'upcoming' : Date.now() <= new Date(event.endsAt).getTime() ? 'ongoing' : 'past';
const formatDate = (value: string) => new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
const formatTime = (value: string) => new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit' }).format(new Date(value));

type Filter = 'upcoming' | 'ongoing' | 'past';

export const EventsPage: React.FC = () => {
  const [events, setEvents] = useState<DevEvent[]>([]);
  const [filter, setFilter] = useState<Filter>('upcoming');
  const [selected, setSelected] = useState<DevEvent | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (!import.meta.env.VITE_SUPABASE_URL) throw new Error('Events API is not configured.');
      const response = await fetch(API, { cache: 'no-store' });
      if (!response.ok) throw new Error('Events API request failed.');
      const body = await response.json();
      const remote = Array.isArray(body.events) ? body.events as DevEvent[] : [];
      setEvents(remote.length ? remote : fallbackEvents);
    } catch {
      setEvents(fallbackEvents);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);
  const visible = useMemo(() => events.filter((event) => statusOf(event) === filter), [events, filter]);

  if (selected) return selected.slug === 'shree-ganesh-utsav-2026'
    ? <GaneshEventDetail event={selected} onBack={() => setSelected(null)} />
    : <EventDetail event={selected} onBack={() => setSelected(null)} />;

  return (
    <div className="space-y-7 pb-16">
      <header className="border-b-2 border-outline-variant pb-7">
        <p className="font-label-mono text-[9px] uppercase tracking-[0.2em] text-primary">DEVCOLLECTIVE / CAMPUS EVENTS</p>
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 mt-3">
          <div><h1 className="dc-display text-5xl sm:text-7xl">EVENTS.</h1><p className="max-w-2xl text-sm text-on-surface-variant mt-3">Real college events, talks, hackathons and community gatherings — organised into one living campus calendar.</p></div>
          <div className="border-2 border-outline-variant bg-surface px-4 py-3 dc-hard-shadow-sm"><p className="font-label-mono text-[9px] uppercase text-on-surface-variant">EVENT DATA</p><p className="font-bold mt-1">{events.length} listed event{events.length === 1 ? '' : 's'}</p><p className="font-label-mono text-[9px] uppercase text-primary mt-1">UPDATED REGULARLY</p></div>
        </div>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-1">{(['upcoming', 'ongoing', 'past'] as Filter[]).map((item) => <button key={item} type="button" onClick={() => setFilter(item)} className={`px-4 py-2.5 border-2 border-outline-variant font-label-mono text-[9px] uppercase shrink-0 ${filter === item ? 'bg-primary text-on-primary' : 'bg-surface hover:bg-surface-container-high'}`}>{item}</button>)}</div>

      {loading ? <div className="p-14 border-2 border-outline-variant bg-surface text-center font-label-mono text-[10px] uppercase">Loading campus events...</div> : visible.length === 0 ? <div className="p-14 border-2 border-dashed border-outline-variant text-center bg-surface"><CalendarDays className="w-7 h-7 mx-auto mb-3 text-on-surface-variant"/><p className="font-label-mono text-[10px] uppercase font-bold">No {filter} events</p><p className="text-xs text-on-surface-variant mt-2">Check another event window.</p></div> : <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">{visible.map((event) => <button key={event.id} type="button" onClick={() => setSelected(event)} className="group text-left border-2 border-outline-variant bg-surface overflow-hidden shadow-[4px_4px_0_#171717] hover:-translate-y-1 transition-transform"><div className="h-3" style={{ background: event.theme.primary }} />{event.slug === 'shree-ganesh-utsav-2026' && <GaneshMiniPoster /> }<div className="p-5"><div className="flex items-center justify-between gap-3 font-label-mono text-[9px] uppercase"><span style={{ color: event.theme.primary }}>{statusOf(event)}</span><span>{event.slug === 'shree-ganesh-utsav-2026' ? '15 Sep 2026' : formatDate(event.startsAt)}</span></div><h2 className="dc-display text-3xl mt-4 group-hover:text-primary">{event.title}</h2><p className="font-label-mono text-[10px] uppercase mt-1">{event.subtitle}</p><p className="text-sm text-on-surface-variant mt-4 line-clamp-3">{event.description}</p><div className="mt-5 pt-4 border-t border-outline-variant/60 space-y-2 text-xs"><div className="flex gap-2"><MapPin className="w-3.5 h-3.5 shrink-0"/>{event.venue}, {event.city}</div><div className="flex gap-2"><Clock3 className="w-3.5 h-3.5 shrink-0"/>{event.slug === 'shree-ganesh-utsav-2026' ? '15 Sep · 10:30 AM' : `${formatTime(event.startsAt)} — ${formatTime(event.endsAt)}`}</div></div><div className="mt-5 flex items-center justify-between font-label-mono text-[9px] uppercase"><span>Open event</span><ArrowUpRight className="w-4 h-4"/></div></div></button>)}</div>}
    </div>
  );
};

const GaneshMiniPoster: React.FC = () => (
  <div className="relative h-44 overflow-hidden bg-[#54149A] text-white">
    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_42%,#F9B51B_0,transparent_18%),radial-gradient(circle_at_50%_55%,#F36B21_0,transparent_42%)]" />
    <div className="absolute left-4 top-3 font-label-mono text-[7px] uppercase tracking-widest">G H RAISONI COLLEGE · NAGPUR</div>
    <div className="absolute right-4 top-3 text-2xl">🪔</div>
    <div className="relative h-full flex flex-col items-center justify-center text-center px-5">
      <div className="text-5xl leading-none">ॐ</div>
      <div className="font-serif text-2xl font-bold mt-2">Shree Ganesh Utsav</div>
      <div className="font-label-mono text-[9px] tracking-[0.18em] text-[#FF9D00] mt-1">CELEBRATION 2026</div>
      <div className="mt-3 bg-[#F36B21] px-3 py-1 font-bold text-[9px]">15 SEPTEMBER · 10:30 AM</div>
    </div>
  </div>
);

const GaneshEventDetail: React.FC<{ event: DevEvent; onBack: () => void }> = ({ event, onBack }) => {
  const [tab, setTab] = useState<'about' | 'schedule' | 'guidelines' | 'organizers'>('about');
  const purple = '#5B169D'; const orange = '#F36B21'; const cream = '#F7F0E5'; const soft = '#EEE2D4';
  const schedule = [
    ['14-Sep-26', 'Monday', 'Hostel', 'Hostel'],
    ['15-Sep-26', 'Tuesday', 'Campus Director Office, Registrar, Deans and COE Office', 'Registrar Office: Account, HR, Student section'],
    ['16-Sep-26', 'Wednesday', 'GHRCEM First Year', 'GHRCEM and GHRSTU - ETC and GHRUA'],
    ['17-Sep-26', 'Thursday', 'GHRCEM - CSE and IT', 'GHRCEM - AI'],
    ['18-Sep-26', 'Friday', 'Hostel', 'Hostel'],
    ['19-Sep-26', 'Saturday', 'GHRSTU First Year', 'Maintenance Department'],
    ['20-Sep-26', 'Sunday', 'Hostel', 'Hostel'],
    ['21-Sep-26', 'Monday', 'Science and Technology', 'GHRCEM and GHRSTU - DS and CYS'],
    ['22-Sep-26', 'Tuesday', 'Polytechnic', 'GHRSTU 2nd/3rd Year (CSE/AI)'],
    ['23-Sep-26', 'Wednesday', 'Commerce and Management', 'GHRCEM and GHRSTU - CE, ME and EE'],
    ['24-Sep-26', 'Thursday', 'Pharmacy and Junior college', 'Mahaprasad and Visarjan'],
  ];
  const guidelines = [
    'College ID Card is compulsory for entry. No entry will be permitted without a valid ID Card.',
    'Students must maintain proper discipline and decorum throughout the celebration.',
    'Follow the instructions of faculty coordinators and event volunteers.',
    'Maintain cleanliness and do not litter the campus premises.',
    'Any misconduct or indiscipline will not be tolerated. Strict action will be taken against students found violating the rules.',
    'Students are requested to cooperate with the organizing team for the smooth and safe conduct of the event.',
  ];
  return (
    <div className="-m-4 sm:-m-8 lg:-m-10 min-h-screen" style={{ background: cream, color: '#171717' }}>
      <div className="bg-[#090909] text-white px-5 sm:px-8 lg:px-12 py-4 flex items-center justify-between"><button type="button" onClick={onBack} className="inline-flex items-center gap-2 font-label-mono text-[9px] uppercase"><ChevronLeft className="w-4 h-4"/> All events</button><div className="font-label-mono text-[9px] uppercase tracking-[0.16em] text-white/60">DEVCOLLECTIVE / CAMPUS EVENTS</div></div>
      <div className="max-w-[1450px] mx-auto px-5 sm:px-8 lg:px-12 py-8 lg:py-12">
        <div className="grid xl:grid-cols-[minmax(390px,0.9fr)_1.25fr] gap-8 lg:gap-10 items-start">
          <div>
            <div className="relative overflow-hidden border-2 border-[#2C1350] shadow-[7px_7px_0_#171717] bg-[#54149A] min-h-[610px] flex flex-col justify-between text-white p-7 sm:p-10">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_37%,#F9B51B_0,transparent_17%),radial-gradient(circle_at_50%_45%,#FF55C8_0,transparent_33%),linear-gradient(180deg,transparent_50%,#2B0755_100%)]" />
              <div className="absolute -right-8 top-0 text-5xl">🪔</div><div className="absolute right-3 top-14 text-5xl">🪔</div>
              <div className="relative flex items-center justify-between gap-4 text-[9px] font-semibold tracking-tight"><span>G H RAISONI<br/><b>COLLEGE</b><small className="block font-normal opacity-80">Engineering and Management<br/>Nagpur</small></span><span className="h-9 w-px bg-white/40"/><span>G H RAISONI<br/><b>SKILL TECH UNIVERSITY</b><small className="block font-normal opacity-80">Nagpur</small></span></div>
              <div className="relative text-center py-10"><div className="text-[7rem] sm:text-[9rem] leading-none drop-shadow-[0_12px_20px_rgba(0,0,0,.25)]">ॐ</div><div className="font-serif text-4xl sm:text-5xl font-bold leading-none">Shree Ganesh Utsav</div><div className="font-label-mono text-lg sm:text-xl text-[#FFB10A] mt-2 tracking-tight">Celebration 2026</div><p className="text-sm mt-5 max-w-md mx-auto leading-relaxed opacity-90">G H Raisoni College of Engineering & Management, Nagpur & G H Raisoni Skill Tech University, Nagpur</p><div className="inline-block mt-5 bg-[#F36B21] px-5 py-3 font-bold">15<sup>th</sup> September 2026 at 10.30 AM<br/><span className="font-normal">Venue: Shraddha Park, Nagpur</span></div><p className="mt-5 text-sm opacity-90">Presided by<br/><b className="text-[#FFB10A] text-lg">Dr Vivek Kapur</b><br/>Campus Director, Shraddha Park Campus</p></div>
              <div className="relative text-center text-xs opacity-90">Special Note<br/><b>Traditional attire is encouraged for all students and faculty.</b><div className="mt-5 font-serif italic text-[#FFB10A] text-xl">Ganpati Bappa Morya!</div><div className="mt-4 text-[8px] tracking-[0.25em]">DEVOTION · DISCIPLINE · TOGETHERNESS</div></div>
            </div>
            <button type="button" onClick={() => setTab('schedule')} className="w-full mt-5 py-4 text-white font-label-mono text-[10px] uppercase font-bold flex items-center justify-center gap-2 shadow-[5px_5px_0_#171717]" style={{ background: purple }}><CalendarDays className="w-4 h-4"/> View full schedule</button>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 font-label-mono text-[9px] uppercase"><span style={{ color: orange }}>EVENT</span><span>/</span><span>15 SEP 2026</span><span>/</span><span>COMMUNITY</span><span className="px-2 py-1 text-white" style={{ background: purple }}>ONGOING</span></div>
            <div className="flex flex-col lg:flex-row lg:items-start gap-5 justify-between"><div><h1 className="dc-display text-5xl sm:text-6xl lg:text-7xl leading-[0.92] tracking-[-0.055em] mt-4 max-w-4xl">Shree Ganesh Utsav<br className="hidden sm:block"/> Celebration 2026</h1><p className="text-base mt-5 max-w-3xl">G H Raisoni College of Engineering and Management, Nagpur & G H Raisoni SkillTech University, Nagpur</p></div><div className="shrink-0 px-6 py-5 text-white font-serif italic text-2xl shadow-[5px_5px_0_#171717]" style={{ background: purple }}>“<br/>Ganpati Bappa<br/>Morya!”</div></div>
            <p className="text-base sm:text-lg leading-relaxed mt-6 max-w-4xl">{event.description}</p>
            <div className="grid md:grid-cols-3 gap-px mt-7 border-2" style={{ borderColor: soft, background: soft }}><Info icon={<CalendarDays className="w-5 h-5"/>} label="15 Sep 2026" sub="Tuesday"/><Info icon={<Clock3 className="w-5 h-5"/>} label="10:30 AM" sub="Onwards"/><Info icon={<MapPin className="w-5 h-5"/>} label="Shraddha Park" sub="Nagpur"/></div>

            <div className="grid grid-cols-4 border-b-2 mt-8" style={{ borderColor: soft }}>{(['about','schedule','guidelines','organizers'] as const).map((item) => <button key={item} type="button" onClick={() => setTab(item)} className="py-4 font-label-mono text-[9px] uppercase" style={{ color: tab === item ? purple : '#444', borderBottom: tab === item ? `3px solid ${purple}` : '3px solid transparent' }}>{item}</button>)}</div>

            {tab === 'about' && <div className="grid lg:grid-cols-[1.05fr_.95fr] gap-4 mt-4"><div className="space-y-4"><InfoCard icon={<CalendarDays className="w-4 h-4"/>} title="Event details"><p>Join us for the Shree Ganesh Utsav Celebration 2026 at Shraddha Park, Nagpur. All students and faculty members are encouraged to participate and be part of this sacred and joyous celebration.</p><div className="mt-4 p-4" style={{ background: '#F0E5FA' }}><div className="flex gap-3"><Shirt className="w-5 h-5 shrink-0" style={{ color: purple }}/><div><b style={{ color: purple }}>SPECIAL NOTE</b><p className="mt-1 text-xs">All students and faculty members are encouraged to wear traditional attire as part of the festive celebrations.</p></div></div></div></InfoCard><InfoCard icon={<Users className="w-4 h-4"/>} title="Presided by"><b style={{ color: purple }}>Dr. Vivek Kapur</b><p>Campus Director, Shraddha Park Campus</p></InfoCard><InfoCard icon={<Users className="w-4 h-4"/>} title="Organized by"><b style={{ color: purple }}>Team Shree Ganesh Utsav Celebration 2026</b><p>Shraddha Park, Nagpur</p></InfoCard></div><InfoCard icon={<ShieldCheck className="w-4 h-4"/>} title="Important instructions for students"><div className="space-y-3">{guidelines.map((item, i) => <div key={item} className="flex gap-3 text-sm"><span className="shrink-0 w-6 h-6 rounded-full text-white flex items-center justify-center font-bold" style={{ background: purple }}>{i + 1}</span><span>{item}</span></div>)}</div><div className="mt-6 pt-5 border-t" style={{ borderColor: soft }}>🙏 Let us celebrate Ganesh Utsav with devotion, discipline and joy.<br/><br/>— Team Shree Ganesh Utsav Celebration 2026</div></InfoCard></div>}
            {tab === 'schedule' && <div className="mt-4 border-2 overflow-x-auto" style={{ borderColor: purple }}><table className="w-full min-w-[760px] text-sm"><thead style={{ background: purple, color: 'white' }}><tr>{['Date','Day','Morning (11.00 am)','Afternoon (4.30 pm)'].map((x) => <th key={x} className="p-3 text-left font-label-mono text-[9px] uppercase">{x}</th>)}</tr></thead><tbody>{schedule.map((row) => <tr key={row[0]} className="border-t" style={{ borderColor: '#F1B184' }}>{row.map((cell, i) => <td key={`${row[0]}-${i}`} className="p-3 align-top">{cell}</td>)}</tr>)}</tbody></table></div>}
            {tab === 'guidelines' && <div className="mt-4 border-2 p-6" style={{ borderColor: purple }}><h2 className="dc-display text-3xl">IMPORTANT INSTRUCTIONS</h2><div className="mt-6 space-y-4">{guidelines.map((item, i) => <div key={item} className="flex gap-4"><span className="shrink-0 w-8 h-8 rounded-full text-white flex items-center justify-center font-bold" style={{ background: purple }}>{i + 1}</span><p>{item}</p></div>)}</div></div>}
            {tab === 'organizers' && <div className="grid md:grid-cols-2 gap-4 mt-4"><InfoCard icon={<Users className="w-4 h-4"/>} title="Presided by"><b style={{ color: purple }}>Dr. Vivek Kapur</b><p>Campus Director, Shraddha Park Campus</p></InfoCard><InfoCard icon={<Users className="w-4 h-4"/>} title="Organized by"><b style={{ color: purple }}>Team Shree Ganesh Utsav Celebration 2026</b><p>Shraddha Park, Nagpur</p></InfoCard></div>}
          </div>
        </div>
      </div>
    </div>
  );
};

const Info: React.FC<{ icon: React.ReactNode; label: string; sub: string }> = ({ icon, label, sub }) => <div className="bg-[#F0E9DF] p-4 flex items-center gap-3"><div className="w-9 h-9 rounded-full border-2 border-[#5B169D] flex items-center justify-center text-[#5B169D]">{icon}</div><div><b className="block text-sm">{label}</b><span className="text-xs text-[#555]">{sub}</span></div></div>;

const InfoCard: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => <div className="border-2 border-[#DDD2C3] bg-white/55 p-5"><div className="flex items-center gap-2 font-label-mono text-[9px] uppercase font-bold"><span className="text-[#5B169D]">{icon}</span>{title}</div><div className="mt-4 text-sm leading-relaxed">{children}</div></div>;

const EventDetail: React.FC<{ event: DevEvent; onBack: () => void }> = ({ event, onBack }) => {
  const status = statusOf(event); const past = status === 'past';
  return <div className="-m-4 sm:-m-8 lg:-m-10" style={{ background: event.theme.background, color: event.theme.foreground }}>
    <div className="min-h-screen"><div className="px-5 sm:px-8 lg:px-12 py-5 border-b-2" style={{ borderColor: event.theme.primary }}><button type="button" onClick={onBack} className="inline-flex items-center gap-2 font-label-mono text-[9px] uppercase"><ChevronLeft className="w-4 h-4"/> All events</button></div>
      <div className="px-5 sm:px-8 lg:px-12 py-10 sm:py-16"><div className="max-w-6xl mx-auto"><p className="font-label-mono text-[10px] uppercase" style={{ color: event.theme.primary }}>EVENT / {formatDate(event.startsAt)} / {status}</p><h1 className="font-black uppercase leading-[.86] text-[clamp(4rem,11vw,9rem)] tracking-[-.07em] mt-4">{event.title}</h1><p className="mt-5 font-label-mono text-xl uppercase tracking-[0.12em]" style={{ color: event.theme.primary }}>{event.subtitle}</p><p className="mt-7 max-w-3xl text-base sm:text-lg leading-relaxed opacity-80">{event.description}</p>
        <div className="grid lg:grid-cols-3 gap-5 mt-12"><div className="lg:col-span-2 border-2 p-6" style={{ borderColor: event.theme.primary }}><p className="font-label-mono text-[9px] uppercase opacity-60">SPEAKERS / VOICES</p><div className="grid sm:grid-cols-2 gap-3 mt-5">{event.speakers.map((speaker) => <div key={speaker} className="border-2 p-4 font-bold" style={{ borderColor: event.theme.primary }}>{speaker}</div>)}</div></div><div className="border-2 p-6" style={{ borderColor: event.theme.primary, background: event.theme.secondary }}><p className="font-label-mono text-[9px] uppercase opacity-60">EVENT DATA</p><div className="space-y-4 mt-5 text-sm"><div><CalendarDays className="w-4 h-4 inline mr-2"/>{formatDate(event.startsAt)}</div><div><Clock3 className="w-4 h-4 inline mr-2"/>{formatTime(event.startsAt)} — {formatTime(event.endsAt)}</div><div><MapPin className="w-4 h-4 inline mr-2"/>{event.venue}, {event.city}</div></div></div></div>
        <div className="grid lg:grid-cols-[1.4fr_.6fr] gap-5 mt-5"><div className="border-2 p-6" style={{ borderColor: event.theme.primary }}><p className="font-label-mono text-[9px] uppercase" style={{ color: event.theme.primary }}>REGISTRATION / {past ? 'CLOSED' : 'OPEN'}</p><h2 className="font-black text-4xl uppercase mt-3">{past ? 'The room has closed.' : 'Reserve your place.'}</h2><p className="mt-4 opacity-70">{event.ticketInfo || 'Registration details are maintained by the organiser.'}</p>{!past && event.registrationUrl && <a href={event.registrationUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-3 mt-7 px-6 py-4 font-label-mono text-[10px] uppercase font-bold" style={{ background: event.theme.primary, color: event.theme.background }}><ExternalLink className="w-4 h-4"/> Register now</a>}{event.sourceUrl && <a href={event.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 mt-4 sm:ml-3 px-5 py-4 border-2 font-label-mono text-[10px] uppercase" style={{ borderColor: event.theme.primary }}>Official page <ArrowUpRight className="w-4 h-4"/></a>}</div><div className="border-2 p-6" style={{ borderColor: event.theme.primary, background: event.theme.secondary }}><p className="font-label-mono text-[9px] uppercase opacity-60">COORDINATION</p><ul className="mt-4 space-y-2 text-sm">{event.coordinators.map((coordinator) => <li key={coordinator}>↳ {coordinator}</li>)}</ul><p className="mt-5 text-xs opacity-70">{event.contactInfo}</p></div></div>
      </div></div>
    </div>
  </div>;
};
