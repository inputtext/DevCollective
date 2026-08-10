import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Trophy, Flame, Search, Share2 } from 'lucide-react';

export const LeaderboardPage: React.FC = () => {
  const { user, leaderboard } = useAuth();
  const [selectedTimeframe, setSelectedTimeframe] = useState<'weekly' | 'monthly' | 'alltime'>('weekly');
  const [selectedBranch, setSelectedBranch] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLeaderboard = leaderboard.filter((entry) => {
    const matchesBranch = selectedBranch === 'All' || entry.branch === selectedBranch;
    const matchesSearch =
      entry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.college.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesBranch && matchesSearch;
  });

  return (
    <div className="space-y-10 pb-16">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 px-3 py-1 rounded-full mb-3">
            <Trophy className="w-4 h-4 text-primary" />
            <span className="font-label-mono text-xs text-primary font-bold uppercase tracking-wider">
              College Standings
            </span>
          </div>
          <h2 className="font-headline-lg text-3xl sm:text-4xl font-bold text-white">
            🏆 College Leaderboard
          </h2>
          <p className="font-body-lg text-on-surface-variant text-base mt-1 max-w-xl">
            The definitive ranking of student developers. Build projects, finish roadmaps, and earn REP to climb the ranks.
          </p>
        </div>

        {/* Timeframe selector */}
        <div className="flex bg-surface-container rounded-xl p-1.5 border-2 border-outline-variant w-fit">
          <button
            onClick={() => setSelectedTimeframe('weekly')}
            className={`px-4 py-2 text-xs font-label-mono uppercase font-bold rounded-lg transition-all ${
              selectedTimeframe === 'weekly' ? 'bg-primary text-on-primary shadow-md' : 'text-outline hover:text-white'
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setSelectedTimeframe('monthly')}
            className={`px-4 py-2 text-xs font-label-mono uppercase font-bold rounded-lg transition-all ${
              selectedTimeframe === 'monthly' ? 'bg-primary text-on-primary shadow-md' : 'text-outline hover:text-white'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setSelectedTimeframe('alltime')}
            className={`px-4 py-2 text-xs font-label-mono uppercase font-bold rounded-lg transition-all ${
              selectedTimeframe === 'alltime' ? 'bg-primary text-on-primary shadow-md' : 'text-outline hover:text-white'
            }`}
          >
            All Time
          </button>
        </div>
      </div>

      {/* User Rank Card */}
      {user && (
        <div className="relative overflow-hidden border-2 border-outline-variant rounded-2xl bg-surface-container-low p-6 sm:p-8 shadow-xl">
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-4 flex items-center gap-4">
              <div className="relative">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-20 h-20 rounded-2xl border-2 border-primary object-cover"
                />
                <span className="absolute -bottom-2 -right-2 bg-primary text-on-primary font-black px-2.5 py-0.5 rounded-md text-xs border-2 border-background">
                  #42
                </span>
              </div>
              <div>
                <h3 className="font-headline-md text-xl font-bold text-white">{user.name}</h3>
                <p className="font-label-mono text-primary text-xs font-bold uppercase">
                  Level {user.level} • {user.branch}
                </p>
                <p className="text-xs text-outline font-label-mono">{user.college}</p>
              </div>
            </div>

            <div className="md:col-span-5 grid grid-cols-3 gap-4 text-center">
              <div>
                <span className="text-[10px] font-label-mono text-outline uppercase block mb-0.5">
                  Reputation
                </span>
                <span className="text-xl font-bold text-white">{user.rep.toLocaleString()} REP</span>
              </div>
              <div>
                <span className="text-[10px] font-label-mono text-outline uppercase block mb-0.5">
                  Streak
                </span>
                <span className="text-xl font-bold text-error flex items-center justify-center gap-1">
                  {user.streakDays}d <Flame className="w-4 h-4 fill-error" />
                </span>
              </div>
              <div>
                <span className="text-[10px] font-label-mono text-outline uppercase block mb-0.5">
                  Next Rank
                </span>
                <span className="text-xl font-bold text-tertiary">#41</span>
              </div>
            </div>

            <div className="md:col-span-3 flex justify-end">
              <button className="px-6 py-3 bg-transparent border-2 border-primary text-primary font-bold text-xs font-label-mono uppercase rounded-xl hover:bg-primary/10 transition-all flex items-center gap-2">
                <Share2 className="w-4 h-4" />
                <span>Share Rank</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top 3 Podium */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
        {/* 2nd Place */}
        <div className="order-2 md:order-1 bg-surface-container border-2 border-outline-variant p-6 rounded-2xl text-center space-y-3 relative group hover:border-secondary transition-all">
          <div className="relative w-20 h-20 mx-auto">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuC58uhRruytSCmk0juhyZZUUHYoZKhfMtR9C3-fnhQgvOEkUYUWAaXpP0PW2EgxaSdq6EJAHxty9shW_INl41W8ggn_-pewTUJZg8cyTDckCd-V5_rOItMIKQ9ulECjD2YNyYibvrM6MOPSQdciv6E76vw11FyglNBVER99hUWgpTq-4UQgVuRmzI-UKhrIWOp3epJKg-zCPEDccWz0JOTvzLXZHTVNrtxTPA4LutZIXBISJMV5icvp9DssDh5xA-eseDeBvf37_9Q"
              alt="Sanya"
              className="w-full h-full rounded-full border-2 border-outline object-cover"
            />
            <span className="absolute -top-1 -right-1 w-7 h-7 bg-[#C0C0C0] text-black font-black rounded-full border-2 border-background flex items-center justify-center text-xs">
              2
            </span>
          </div>
          <div>
            <h4 className="font-bold text-lg text-white">Sanya Verma</h4>
            <p className="font-label-mono text-xs text-outline">MIT • 4,820 REP</p>
          </div>
        </div>

        {/* 1st Place */}
        <div className="order-1 md:order-2 bg-surface-container border-2 border-primary p-6 rounded-2xl text-center space-y-3 relative shadow-[0_0_25px_rgba(79,70,229,0.3)]">
          <div className="relative w-24 h-24 mx-auto">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDfOJJp2Cs8Wi6Op4GcxcyVET725RT_Q8wUuV3FVSj1R3jNBjgw3eN7_fl18tPG6WejSXa8chKuFiZ0DtC3aWhjb90dvBCFJdAXt26J6nnp-EJe72xX90RJmgbztF8ckA-XEu9544PeyfHsNcHShzdrXNPfQoe0fCCfvv5UJjiWq0AXtAIgqwKh-hMd4deTOFMTKMEHiBNxDcvzQh5f9S94cP4WQiT9dlc19R7Kq5lcjCyNHcXL5TDKlxLIKO4cBptIABWj4vpcVbI"
              alt="Kartik"
              className="w-full h-full rounded-full border-2 border-primary object-cover"
            />
            <span className="absolute -top-2 -right-1 w-8 h-8 bg-primary text-on-primary font-black rounded-full border-2 border-background flex items-center justify-center text-sm">
              1
            </span>
          </div>
          <div>
            <h4 className="font-bold text-xl text-white">Kartik Aryan</h4>
            <p className="font-label-mono text-xs text-primary font-bold">IIT Bombay • 6,140 REP</p>
          </div>
        </div>

        {/* 3rd Place */}
        <div className="order-3 md:order-3 bg-surface-container border-2 border-outline-variant p-6 rounded-2xl text-center space-y-3 relative group hover:border-tertiary transition-all">
          <div className="relative w-20 h-20 mx-auto">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBHm69iFZgN81K30IaUsptMAMNCtuNZRNylDjyeIu3Ux6dYRvqte98DaJGiCt82n2oPEJcolLc1cg5_77DLFQkft0S95E753SOc8ucXGD2is0XjYr7vJABnyxMS47sWMAhxdGBe26SWwWV-A-YrqiYVtBQGwy3TflnTlKOqcPKIobzT3IogYx7vTKRm88paqp5j0LdYvZ-_DY1yZyHZbm8dXqW4Xp9y17C9FlXtgcPFiRClGKmWEqWAdn318LCGsfQ3th3G3n3PV8A"
              alt="Rohan"
              className="w-full h-full rounded-full border-2 border-outline object-cover"
            />
            <span className="absolute -top-1 -right-1 w-7 h-7 bg-[#CD7F32] text-white font-black rounded-full border-2 border-background flex items-center justify-center text-xs">
              3
            </span>
          </div>
          <div>
            <h4 className="font-bold text-lg text-white">Rohan Das</h4>
            <p className="font-label-mono text-xs text-outline">Georgia Tech • 4,210 REP</p>
          </div>
        </div>
      </div>

      {/* Filter Row & Search */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {['All', 'CSE', 'IT', 'AIML', 'ECE'].map((b) => (
            <button
              key={b}
              onClick={() => setSelectedBranch(b)}
              className={`px-4 py-2 rounded-lg font-label-mono text-xs uppercase font-bold transition-all ${
                selectedBranch === b
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface border border-outline-variant text-outline hover:text-white'
              }`}
            >
              {b}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student or college..."
            className="w-full bg-surface border-2 border-outline-variant rounded-xl pl-9 pr-4 py-2 text-xs font-label-mono text-white focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface-container-low border-2 border-outline-variant rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-container border-b-2 border-outline-variant font-label-mono text-xs uppercase text-outline">
              <tr>
                <th className="p-4 sm:p-5">Rank</th>
                <th className="p-4 sm:p-5">Developer</th>
                <th className="p-4 sm:p-5">Branch</th>
                <th className="p-4 sm:p-5">Reputation</th>
                <th className="p-4 sm:p-5 text-right">Streak</th>
              </tr>
            </thead>
            <tbody className="divide-y border-outline-variant/30 text-sm">
              {filteredLeaderboard.map((entry) => (
                <tr
                  key={entry.id}
                  className={`transition-colors ${
                    entry.isUser
                      ? 'bg-primary/10 font-bold border-l-4 border-l-primary'
                      : 'hover:bg-surface-container/50'
                  }`}
                >
                  <td className="p-4 sm:p-5 font-black text-primary">#{entry.rank}</td>
                  <td className="p-4 sm:p-5 flex items-center gap-3">
                    <img
                      src={entry.avatar}
                      alt={entry.name}
                      className="w-10 h-10 rounded-full border border-primary object-cover"
                    />
                    <div>
                      <p className="font-bold text-white flex items-center gap-2">
                        {entry.name}
                        {entry.isUser && (
                          <span className="text-[10px] bg-primary text-on-primary px-1.5 py-0.5 rounded font-label-mono">
                            YOU
                          </span>
                        )}
                      </p>
                      <p className="text-[11px] text-outline font-label-mono">{entry.college}</p>
                    </div>
                  </td>
                  <td className="p-4 sm:p-5 font-label-mono text-xs text-on-surface-variant">
                    {entry.branch}
                  </td>
                  <td className="p-4 sm:p-5 font-bold text-primary">
                    {entry.rep.toLocaleString()} <span className="text-[10px] font-label-mono">REP</span>
                  </td>
                  <td className="p-4 sm:p-5 text-right font-bold text-error flex items-center justify-end gap-1">
                    {entry.streakDays}d <Flame className="w-4 h-4 fill-error" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
