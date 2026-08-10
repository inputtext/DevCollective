import React from 'react';
import { useAuth, PageTab } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Map,
  Trophy,
  UserCheck,
  User,
  ShieldCheck,
  PlusCircle,
  Settings,
  HelpCircle,
  Terminal,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, user, sidebarCollapsed, toggleSidebar } = useAuth();

  const navItems: { id: PageTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'community', label: 'Community', icon: <Users className="w-5 h-5" /> },
    { id: 'roadmap', label: 'Roadmaps', icon: <Map className="w-5 h-5" /> },
    { id: 'leaderboard', label: 'Leaderboard', icon: <Trophy className="w-5 h-5" /> },
    { id: 'mentors', label: 'Mentors', icon: <UserCheck className="w-5 h-5" /> },
    { id: 'profile', label: 'Profile', icon: <User className="w-5 h-5" /> },
    { id: 'admin', label: 'Admin Terminal', icon: <ShieldCheck className="w-5 h-5" /> },
  ];

  return (
    <aside
      className={`sticky top-0 h-screen shrink-0 bg-surface border-r-2 border-outline-variant hidden md:flex flex-col py-6 overflow-y-auto transition-all duration-300 z-30 ${
        sidebarCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Header & Toggle Button */}
      <div className="px-4 mb-6 flex items-center justify-between">
        {!sidebarCollapsed ? (
          <div
            onClick={() => setActiveTab('landing')}
            className="flex items-center gap-3 cursor-pointer group min-w-0"
          >
            <div className="w-10 h-10 bg-primary-container rounded-lg flex items-center justify-center text-white shrink-0 shadow-lg group-hover:scale-105 transition-transform">
              <Terminal className="w-6 h-6" />
            </div>
            <div className="min-w-0 overflow-hidden">
              <h1 className="font-headline-md text-xl font-black text-primary leading-none tracking-tighter truncate">
                DevCollective
              </h1>
              <p className="text-[10px] font-label-mono text-outline uppercase tracking-widest mt-1 truncate">
                Build. Scale. Lead.
              </p>
            </div>
          </div>
        ) : (
          <div
            onClick={() => setActiveTab('landing')}
            className="mx-auto cursor-pointer group"
            title="DevCollective — Build. Scale. Lead."
          >
            <div className="w-10 h-10 bg-primary-container rounded-lg flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform">
              <Terminal className="w-6 h-6" />
            </div>
          </div>
        )}

        {!sidebarCollapsed && (
          <button
            onClick={toggleSidebar}
            title="Collapse sidebar"
            className="p-2 rounded-lg text-on-surface-variant hover:text-white hover:bg-surface-container border border-outline-variant/50 transition-colors ml-2 shrink-0"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        )}
      </div>

      {sidebarCollapsed && (
        <div className="px-3 mb-4">
          <button
            onClick={toggleSidebar}
            title="Expand sidebar"
            className="w-full flex items-center justify-center py-2 rounded-lg text-on-surface-variant hover:text-white hover:bg-surface-container border border-outline-variant/50 transition-colors"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation Items */}
      <nav className="flex-1 space-y-1.5 px-3">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              title={sidebarCollapsed ? item.label : undefined}
              className={`w-full flex items-center rounded-xl transition-all duration-200 font-label-mono text-sm uppercase ${
                sidebarCollapsed
                  ? 'justify-center p-3'
                  : 'gap-3.5 px-4 py-3 text-left'
              } ${
                isActive
                  ? 'text-primary bg-primary/10 border-l-4 border-primary font-bold shadow-sm'
                  : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface'
              }`}
            >
              <div className="shrink-0">{item.icon}</div>
              {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Action Footer */}
      <div className="px-3 mt-auto space-y-4 pt-4 border-t-2 border-outline-variant">
        {!sidebarCollapsed ? (
          <button
            onClick={() => setActiveTab('community')}
            className="w-full bg-primary-container text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-[4px_4px_0px_0px_#27272A]"
          >
            <PlusCircle className="w-5 h-5 shrink-0" />
            <span className="truncate">Post Project</span>
          </button>
        ) : (
          <button
            onClick={() => setActiveTab('community')}
            title="Post Project"
            className="w-full bg-primary-container text-white p-3 rounded-xl font-bold flex items-center justify-center hover:brightness-110 active:scale-95 transition-all shadow-[2px_2px_0px_0px_#27272A]"
          >
            <PlusCircle className="w-5 h-5" />
          </button>
        )}

        <div className="space-y-1">
          <button
            onClick={() => setActiveTab('profile-setup')}
            title={sidebarCollapsed ? 'Profile Settings' : undefined}
            className={`w-full flex items-center text-on-surface-variant hover:text-on-surface transition-colors font-label-mono text-xs uppercase ${
              sidebarCollapsed ? 'justify-center p-2.5 rounded-lg hover:bg-surface-container' : 'gap-3 px-2 py-2'
            }`}
          >
            <Settings className="w-4 h-4 shrink-0" />
            {!sidebarCollapsed && <span className="truncate">Profile Settings</span>}
          </button>
          <button
            onClick={() => setActiveTab('choose-path')}
            title={sidebarCollapsed ? 'Learning Paths' : undefined}
            className={`w-full flex items-center text-on-surface-variant hover:text-on-surface transition-colors font-label-mono text-xs uppercase ${
              sidebarCollapsed ? 'justify-center p-2.5 rounded-lg hover:bg-surface-container' : 'gap-3 px-2 py-2'
            }`}
          >
            <HelpCircle className="w-4 h-4 shrink-0" />
            {!sidebarCollapsed && <span className="truncate">Learning Paths</span>}
          </button>
        </div>

        {user && (
          <div
            onClick={() => setActiveTab('profile')}
            title={sidebarCollapsed ? `${user.name} (${user.rep.toLocaleString()} REP)` : undefined}
            className={`p-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl flex items-center gap-3 cursor-pointer hover:border-primary transition-colors ${
              sidebarCollapsed ? 'justify-center' : ''
            }`}
          >
            <img
              src={user.avatar}
              alt={user.name}
              className="w-8 h-8 rounded-full border border-primary object-cover shrink-0"
            />
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">{user.name}</p>
                <p className="text-[10px] text-primary font-label-mono">
                  {user.rep.toLocaleString()} REP
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
