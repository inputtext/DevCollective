import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, CalendarDays, ChevronLeft, Clock3, ExternalLink, MapPin } from 'lucide-react';
import type { DevEvent } from '../types';

const API = `${String(import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '')}/functions/v1/events`;

const fallback: DevEvent = {
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
};

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
      setEvents(Array.isArray(body.events) ? body.events : []);
    } catch {
      setEvents([fallback]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const visible = useMemo(() => events.filter((event) => statusOf(event) === filter), [events, filter]);

  if (selected) return <EventDetail event={selected} onBack={() => setSelected(null)} />;

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

      {loading ? <div className="p-14 border-2 border-outline-variant bg-surface text-center font-label-mono text-[10px] uppercase">Loading campus events...</div> : visible.length === 0 ? <div className="p-14 border-2 border-dashed border-outline-variant text-center bg-surface"><CalendarDays className="w-7 h-7 mx-auto mb-3 text-on-surface-variant"/><p className="font-label-mono text-[10px] uppercase font-bold">No {filter} events</p><p className="text-xs text-on-surface-variant mt-2">Check another event window.</p></div> : <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">{visible.map((event) => <button key={event.id} type="button" onClick={() => setSelected(event)} className="group text-left border-2 border-outline-variant bg-surface overflow-hidden shadow-[4px_4px_0_#171717] hover:-translate-y-1 transition-transform"><div className="h-3" style={{ background: event.theme.primary }} /><div className="p-5"><div className="flex items-center justify-between gap-3 font-label-mono text-[9px] uppercase"><span style={{ color: event.theme.primary }}>{statusOf(event)}</span><span>{formatDate(event.startsAt)}</span></div><h2 className="dc-display text-3xl mt-4 group-hover:text-primary">{event.title}</h2><p className="font-label-mono text-[10px] uppercase mt-1">{event.subtitle}</p><p className="text-sm text-on-surface-variant mt-4 line-clamp-3">{event.description}</p><div className="mt-5 pt-4 border-t border-outline-variant/60 space-y-2 text-xs"><div className="flex gap-2"><MapPin className="w-3.5 h-3.5 shrink-0"/>{event.venue}, {event.city}</div><div className="flex gap-2"><Clock3 className="w-3.5 h-3.5 shrink-0"/>{formatTime(event.startsAt)} — {formatTime(event.endsAt)}</div></div><div className="mt-5 flex items-center justify-between font-label-mono text-[9px] uppercase"><span>Open event</span><ArrowUpRight className="w-4 h-4"/></div></div></button>)}</div>}
    </div>
  );
};

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
