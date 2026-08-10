import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mentor } from '../types';
import {
  Brain,
  Star,
  Users,
  Lock,
  Calendar,
  Check,
  Search,
  X,
  MessageSquare,
} from 'lucide-react';

export const MentorDirectoryPage: React.FC = () => {
  const { mentors, user } = useAuth();
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeBookingMentor, setActiveBookingMentor] = useState<Mentor | null>(null);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  const filteredMentors = mentors.filter((m) => {
    const matchesRole = selectedRole === 'ALL' || m.roleType === selectedRole;
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
      m.college.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRole && matchesSearch;
  });

  const handleBookSession = () => {
    setBookingConfirmed(true);
    setTimeout(() => {
      setBookingConfirmed(false);
      setActiveBookingMentor(null);
    }, 1500);
  };

  return (
    <div className="space-y-10 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 bg-tertiary/10 border border-tertiary/30 px-3 py-1 rounded-full mb-3">
            <Brain className="w-4 h-4 text-tertiary" />
            <span className="font-label-mono text-xs text-tertiary font-bold uppercase tracking-wider">
              Verified Mentors
            </span>
          </div>
          <h2 className="font-headline-lg text-3xl sm:text-4xl font-bold text-white">
            Mentor Directory
          </h2>
          <p className="font-body-lg text-on-surface-variant text-base mt-1 max-w-xl">
            Connect with senior developers, alumni, and faculty members for project guidance and career architecture.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search skills, roles, names..."
            className="w-full bg-surface border-2 border-outline-variant rounded-xl pl-9 pr-4 py-2.5 text-xs font-label-mono text-white focus:outline-none focus:border-secondary"
          />
        </div>
      </div>

      {/* Level 3 Messaging Lock Banner */}
      <div className="border-2 border-primary/40 rounded-2xl p-6 bg-gradient-to-r from-surface-container-low to-surface-container relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-primary font-label-mono text-xs font-bold uppercase">
              <Lock className="w-4 h-4" />
              <span>Current Status: Level {user?.level || 18}</span>
            </div>
            <h3 className="font-headline-md text-xl font-bold text-white">
              Unlock Direct 1-on-1 Mentor Messaging
            </h3>
            <p className="text-xs text-on-surface-variant max-w-xl">
              Reach Level 20 or earn 3,000 REP to enable unlimited private messaging with alumni and faculty.
            </p>
          </div>

          <div className="w-full md:w-64 space-y-1.5">
            <div className="flex justify-between text-[11px] font-label-mono text-outline uppercase">
              <span>REP Progress</span>
              <span className="text-primary font-bold">{user?.rep || 2450} / 3,000 REP</span>
            </div>
            <div className="w-full h-3 bg-surface-container-highest rounded-full overflow-hidden border border-outline-variant">
              <div
                className="bg-primary h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, ((user?.rep || 2450) / 3000) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Role Filters */}
      <div className="flex flex-wrap gap-2">
        {['ALL', 'SENIOR', 'FACULTY', 'ALUMNI'].map((role) => (
          <button
            key={role}
            onClick={() => setSelectedRole(role)}
            className={`px-4 py-2 rounded-xl font-label-mono text-xs uppercase font-bold transition-all ${
              selectedRole === role
                ? 'bg-primary text-on-primary'
                : 'bg-surface border border-outline-variant text-outline hover:text-white'
            }`}
          >
            {role}
          </button>
        ))}
      </div>

      {/* Mentors Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMentors.map((m) => (
          <div
            key={m.id}
            className="bg-surface-container border-2 border-outline-variant rounded-2xl p-6 flex flex-col justify-between hover:border-primary transition-all group"
          >
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <img
                    src={m.avatar}
                    alt={m.name}
                    className="w-14 h-14 rounded-2xl border-2 border-primary object-cover"
                  />
                  <div>
                    <h4 className="font-bold text-lg text-white">{m.name}</h4>
                    <p className="text-xs text-on-surface-variant font-medium">{m.title}</p>
                    <p className="text-[10px] text-outline font-label-mono">{m.college}</p>
                  </div>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-label-mono uppercase font-bold border ${
                    m.roleType === 'FACULTY'
                      ? 'bg-tertiary/10 text-tertiary border-tertiary/30'
                      : m.roleType === 'ALUMNI'
                      ? 'bg-secondary/10 text-secondary border-secondary/30'
                      : 'bg-primary/10 text-primary border-primary/30'
                  }`}
                >
                  {m.roleType}
                </span>
              </div>

              <p className="text-xs text-on-surface-variant leading-relaxed mb-4 line-clamp-2 italic">
                "{m.bio}"
              </p>

              {/* Skills */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {m.skills.map((s) => (
                  <span
                    key={s}
                    className="bg-surface-container-lowest border border-outline-variant/60 px-2.5 py-0.5 rounded text-[10px] font-label-mono text-outline"
                  >
                    {s}
                  </span>
                ))}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 border-y border-outline-variant/30 py-3 text-center text-xs mb-4">
                <div>
                  <span className="text-[10px] text-outline font-label-mono block uppercase">
                    Level
                  </span>
                  <span className="font-bold text-primary">{m.level}</span>
                </div>
                <div className="border-x border-outline-variant/30">
                  <span className="text-[10px] text-outline font-label-mono block uppercase">
                    Rating
                  </span>
                  <span className="font-bold text-tertiary flex items-center justify-center gap-0.5">
                    {m.rating} <Star className="w-3 h-3 fill-tertiary" />
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-outline font-label-mono block uppercase">
                    Students
                  </span>
                  <span className="font-bold text-white">{m.studentsHelped}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-outline mb-4">
                <Calendar className="w-3.5 h-3.5" />
                <span>{m.availability}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setActiveBookingMentor(m)}
                className="py-2.5 bg-primary text-on-primary font-bold text-xs font-label-mono uppercase rounded-xl hover:brightness-110 transition-all flex items-center justify-center gap-1.5"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Book</span>
              </button>

              <button
                disabled={user ? user.rep < 3000 : true}
                className={`py-2.5 rounded-xl font-bold text-xs font-label-mono uppercase flex items-center justify-center gap-1.5 transition-all ${
                  user && user.rep >= 3000
                    ? 'border-2 border-primary text-primary hover:bg-primary/10'
                    : 'bg-surface-container-highest text-outline cursor-not-allowed opacity-60'
                }`}
                title={user && user.rep < 3000 ? 'Requires 3,000 REP or Level 20' : 'Send Message'}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Message</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Booking Session Modal */}
      {activeBookingMentor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <div className="bg-surface-container border-2 border-outline-variant rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setActiveBookingMentor(null)}
              className="absolute top-4 right-4 text-outline hover:text-white p-2 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <img
                src={activeBookingMentor.avatar}
                alt={activeBookingMentor.name}
                className="w-12 h-12 rounded-full border border-primary object-cover"
              />
              <div>
                <h3 className="font-bold text-lg text-white">{activeBookingMentor.name}</h3>
                <p className="text-xs text-outline font-label-mono">{activeBookingMentor.title}</p>
              </div>
            </div>

            <div className="space-y-4 text-xs font-label-mono mb-6">
              <div className="p-3 bg-surface-container-lowest rounded-xl border border-outline-variant">
                <span className="text-outline uppercase block mb-1">Available Hours</span>
                <p className="text-white font-bold">{activeBookingMentor.availability}</p>
              </div>

              <div className="space-y-1">
                <label className="text-outline uppercase block">Session Agenda / Topic</label>
                <input
                  type="text"
                  placeholder="e.g. Code Review for Neural Network Model"
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-3 text-white focus:outline-none focus:border-secondary"
                />
              </div>
            </div>

            <button
              onClick={handleBookSession}
              className={`w-full py-3.5 rounded-xl font-bold font-label-mono text-xs uppercase flex items-center justify-center gap-2 transition-all ${
                bookingConfirmed
                  ? 'bg-tertiary text-on-tertiary'
                  : 'bg-primary-container text-white hover:brightness-110'
              }`}
            >
              {bookingConfirmed ? <Check className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
              <span>{bookingConfirmed ? 'Session Requested!' : 'Confirm Mentorship Slot'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
