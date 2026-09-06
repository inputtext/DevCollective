import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Search, Bell, Shield, LogOut, Terminal, Menu, X, Heart, CheckCheck } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

const timeAgo = (value: string) => {
 const seconds = Math.max(1, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
 if (seconds < 60) return `${seconds}s ago`;
 const minutes = Math.floor(seconds / 60);
 if (minutes < 60) return `${minutes}m ago`;
 const hours = Math.floor(minutes / 60);
 if (hours < 24) return `${hours}h ago`;
 const days = Math.floor(hours / 24);
 return `${days}d ago`;
};

export const Navbar: React.FC = () => {
 const { user, activeTab, setActiveTab, logout, setShowOAuthModal } = useAuth();
 const { notifications, unreadCount, panelOpen, setPanelOpen, markAllRead, markRead } = useNotifications();
 const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
 const isStandalone = ['landing', 'login', 'register'].includes(activeTab);
 const go = (tab: Parameters<typeof setActiveTab>[0]) => { setActiveTab(tab); setMobileMenuOpen(false); };

 useEffect(() => {
   if (!panelOpen) return;
   const handleOutside = (event: MouseEvent) => {
     const target = event.target as HTMLElement;
     if (!target.closest('[data-notification-panel]')) setPanelOpen(false);
   };
   document.addEventListener('mousedown', handleOutside);
   return () => document.removeEventListener('mousedown', handleOutside);
 }, [panelOpen, setPanelOpen]);

 return <header className="sticky top-0 z-40 h-[74px] border-b-2 border-outline-variant bg-background/90 backdrop-blur-xl flex items-center justify-between px-4 sm:px-6 lg:px-10">
  <div className="flex items-center gap-3 min-w-0">
   <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 border-2 border-outline-variant bg-surface" aria-label="Toggle menu">{mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}</button>
   {isStandalone ? <button onClick={() => go(user ? 'dashboard' : 'landing')} className="flex items-center gap-3"><span className="w-9 h-9 border-2 border-outline-variant bg-primary flex items-center justify-center text-on-primary dc-hard-shadow-sm"><Terminal className="w-5 h-5" /></span><span className="dc-display text-xl sm:text-2xl font-bold tracking-tight hidden sm:block">DEV_COLLECTIVE</span></button> : <div className="flex items-center gap-3 w-full max-w-md border-2 border-outline-variant bg-surface px-4 py-2.5"><Search className="w-4 h-4 text-on-surface-variant" /><input type="text" placeholder="Search projects, mentors, roadmaps..." className="bg-transparent border-none outline-none text-xs sm:text-sm w-full text-on-surface placeholder:text-on-surface-variant" /></div>}
  </div>
  <div className="flex items-center gap-2 sm:gap-3">
   <div className="hidden lg:flex items-center gap-2 border-2 border-outline-variant bg-secondary-container px-3 py-2 dc-mono text-[9px] uppercase tracking-[0.12em] text-on-secondary"><span className="w-1.5 h-1.5 rounded-full bg-on-secondary" /> C·FLOW / IN BUILD</div>
   <ThemeToggle />
   <button onClick={() => setShowOAuthModal(true)} className="hidden xl:flex items-center gap-2 px-3 py-2 border-2 border-outline-variant bg-surface dc-mono text-[9px] uppercase text-primary"><Shield className="w-3.5 h-3.5" /> OAuth Keys</button>
   <div className="relative" data-notification-panel>
    <button onClick={() => setPanelOpen(!panelOpen)} className={`relative p-2 border-2 hover:border-outline-variant hover:bg-surface ${unreadCount ? 'text-primary' : 'border-transparent text-on-surface-variant'}`} aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}>
      <Bell className={`w-5 h-5 ${unreadCount ? 'animate-[dcBell_1.8s_ease-in-out_infinite]' : ''}`} />
      {unreadCount > 0 && <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-dc-pink border-2 border-outline-variant text-[9px] font-bold flex items-center justify-center text-black">{unreadCount > 9 ? '9+' : unreadCount}</span>}
    </button>
    {panelOpen && <div className="absolute right-0 mt-3 w-[min(380px,calc(100vw-24px))] bg-surface border-2 border-outline-variant shadow-[7px_7px_0_#171717] z-50 overflow-hidden">
      <div className="flex items-center justify-between gap-4 px-4 py-3 border-b-2 border-outline-variant">
       <div><p className="dc-mono text-[10px] uppercase font-bold text-primary">Notifications</p><p className="text-[11px] text-on-surface-variant mt-0.5">Community activity on your work</p></div>
       <button onClick={() => void markAllRead()} disabled={!unreadCount} className="flex items-center gap-1.5 text-[9px] uppercase font-bold text-on-surface-variant hover:text-primary disabled:opacity-40"><CheckCheck className="w-3.5 h-3.5" /> Mark read</button>
      </div>
      <div className="max-h-[360px] overflow-y-auto">
       {notifications.length === 0 ? <div className="p-8 text-center"><Bell className="w-6 h-6 mx-auto mb-2 text-on-surface-variant" /><p className="dc-mono text-[10px] uppercase font-bold">No notifications yet</p><p className="text-[11px] text-on-surface-variant mt-2">When someone likes your post or comment, it will appear here.</p></div> : notifications.map((notification) => <button key={notification.id} onClick={() => { if (!notification.readAt) void markRead([notification.id]); setPanelOpen(false); go('community'); }} className={`w-full text-left p-4 border-b border-outline-variant/40 flex gap-3 transition-colors ${notification.readAt ? 'bg-surface' : 'bg-dc-blue/20'}`}>
         {notification.actorAvatar ? <img src={notification.actorAvatar} alt={notification.actorName} className="w-9 h-9 border-2 border-outline-variant object-cover shrink-0" /> : <div className="w-9 h-9 border-2 border-outline-variant bg-dc-yellow flex items-center justify-center font-bold shrink-0">{notification.actorName.slice(0, 1)}</div>}
         <div className="min-w-0 flex-1"><div className="flex items-start gap-2"><Heart className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" fill="currentColor" /><p className="text-xs leading-relaxed"><strong>{notification.actorName}</strong>{notification.type === 'post_like' ? ' liked your post.' : ' liked your comment.'}</p>{!notification.readAt && <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1" />}</div><p className="text-[11px] text-on-surface-variant mt-1 line-clamp-2">{notification.type === 'post_like' ? notification.postTitle : `“${notification.commentPreview}”`}</p><p className="dc-mono text-[8px] uppercase text-on-surface-variant mt-2">{timeAgo(notification.createdAt)}</p></div>
       </button>)}
      </div>
    </div>}
   </div>
   {user ? <div className="flex items-center gap-2"><button onClick={() => go('profile')} className="flex items-center gap-2 bg-surface border-2 border-outline-variant p-1 pr-2 sm:pr-3 hover:border-primary"><img src={user.avatar} alt={user.name} className="w-8 h-8 object-cover border border-outline-variant" /><span className="dc-mono text-[9px] text-primary hidden sm:block">{user.rep.toLocaleString()} REP</span></button><button onClick={logout} title="Logout" className="p-2 border-2 border-transparent hover:border-error text-on-surface-variant"><LogOut className="w-4 h-4" /></button></div> : <div className="flex items-center gap-1 sm:gap-2"><button onClick={() => go('login')} className="dc-mono text-[10px] uppercase px-3 py-2 text-on-surface-variant hover:text-primary">Login</button><button onClick={() => go('register')} className="dc-mono text-[10px] uppercase px-4 py-2 bg-primary text-on-primary border-2 border-outline-variant dc-hard-shadow-sm">Register</button></div>}
  </div>
  {mobileMenuOpen && <div className="md:hidden fixed top-[74px] left-0 right-0 bg-background border-b-2 border-outline-variant p-4 shadow-[0_6px_0_var(--outline-variant)] z-50"><div className="dc-mono text-[9px] uppercase tracking-[0.16em] text-on-surface-variant mb-3">Navigation / 00</div><div className="grid grid-cols-2 gap-2">{[['dashboard', 'Dashboard'], ['community', 'Community'], ['roadmap', 'Roadmaps'], ['leaderboard', 'Leaderboard'], ['mentors', 'Mentors'], ['profile', 'Profile'], ['admin', 'Admin Terminal']].map(([id, label]) => <button key={id} onClick={() => go(id as Parameters<typeof setActiveTab>[0])} className="p-3 text-left bg-surface border-2 border-outline-variant dc-mono text-[10px] uppercase hover:border-primary">{label}</button>)}</div><div className="mt-3 p-3 border-2 border-outline-variant bg-secondary-container text-on-secondary dc-mono text-[9px] uppercase">C·FLOW / Integration in build</div></div>}
 </header>;
};
