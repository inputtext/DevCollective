import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Search, Bell, Shield, LogOut, User, Terminal, Menu, X } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

export const Navbar: React.FC = () => {
  const { user, activeTab, setActiveTab, logout, setShowOAuthModal } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isStandalone = ['landing', 'login', 'register'].includes(activeTab);

  return (
    <header
      className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b-2 border-outline-variant h-20 flex items-center justify-between px-4 md:px-10 w-full"
    >
      {/* Search or Brand */}
      <div className="flex items-center gap-4 flex-1">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-on-surface-variant hover:text-white p-2"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {isStandalone ? (
          <div
            onClick={() => setActiveTab('landing')}
            className="flex items-center gap-3 cursor-pointer"
          >
            <div className="w-9 h-9 bg-primary-container rounded-lg flex items-center justify-center text-white">
              <Terminal className="w-5 h-5" />
            </div>
            <span className="font-headline-md text-xl font-bold text-white tracking-tighter">
              DEV_COLLECTIVE
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-3 bg-surface-container-low px-4 py-2 border-2 border-outline-variant rounded-full w-full max-w-md focus-within:border-primary transition-colors">
            <Search className="w-4 h-4 text-outline" />
            <input
              type="text"
              placeholder="Search projects, mentors, roadmaps..."
              className="bg-transparent border-none focus:outline-none text-xs md:text-sm w-full text-white placeholder:text-outline"
            />
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Theme Toggle */}
        <ThemeToggle />

        {/* OAuth Guide Modal Trigger */}
        <button
          onClick={() => setShowOAuthModal(true)}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-surface-container border border-outline-variant hover:border-primary rounded-full text-xs font-label-mono text-primary transition-colors"
          title="Configure Google and GitHub OAuth"
        >
          <Shield className="w-3.5 h-3.5" />
          <span>OAuth Keys</span>
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative text-on-surface-variant hover:text-primary transition-all p-2 rounded-full hover:bg-surface-container"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-surface-container border-2 border-outline-variant rounded-2xl p-4 shadow-2xl z-50 animate-fade-in">
              <div className="flex justify-between items-center mb-3 pb-2 border-b border-outline-variant">
                <span className="font-label-mono text-xs uppercase font-bold text-primary">
                  Notifications
                </span>
                <span className="text-[10px] text-outline">3 New</span>
              </div>
              <div className="space-y-3 text-xs">
                <div className="p-2.5 bg-surface-container-low rounded-xl border border-outline-variant/30">
                  <p className="font-bold text-white mb-0.5">Level 18 Unlocked!</p>
                  <p className="text-on-surface-variant text-[11px]">
                    You earned +50 REP for completing Neural Networks introduction.
                  </p>
                </div>
                <div className="p-2.5 bg-surface-container-low rounded-xl border border-outline-variant/30">
                  <p className="font-bold text-white mb-0.5">Mentor Feedback</p>
                  <p className="text-on-surface-variant text-[11px]">
                    Rahul Sharma reviewed your PyTorch project repository.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Badges or Login/Register */}
        {user ? (
          <div className="flex items-center gap-3">
            <div
              onClick={() => setActiveTab('profile')}
              className="flex items-center gap-2.5 bg-surface-container rounded-full p-1 pl-3.5 border-2 border-outline-variant hover:border-primary cursor-pointer transition-colors"
            >
              <span className="text-label-mono text-xs font-bold text-secondary hidden sm:inline">
                {user.rep.toLocaleString()} REP
              </span>
              <img
                src={user.avatar}
                alt={user.name}
                className="w-8 h-8 rounded-full object-cover border border-primary"
              />
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="text-on-surface-variant hover:text-error p-2 rounded-full hover:bg-surface-container transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('login')}
              className="font-label-mono text-xs uppercase text-on-surface-variant hover:text-white px-3 py-2 transition-colors"
            >
              LOGIN
            </button>
            <button
              onClick={() => setActiveTab('register')}
              className="bg-primary-container text-white font-label-mono text-xs uppercase px-5 py-2 rounded-full hover:bg-primary-container/80 transition-all active:scale-95"
            >
              REGISTER
            </button>
          </div>
        )}
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed top-20 left-0 right-0 bg-surface border-b-2 border-outline-variant p-6 space-y-4 shadow-2xl z-50">
          <div className="grid grid-cols-2 gap-3 font-label-mono text-xs uppercase">
            <button
              onClick={() => {
                setActiveTab('dashboard');
                setMobileMenuOpen(false);
              }}
              className="p-3 bg-surface-container rounded-xl text-left border border-outline-variant text-white"
            >
              Dashboard
            </button>
            <button
              onClick={() => {
                setActiveTab('community');
                setMobileMenuOpen(false);
              }}
              className="p-3 bg-surface-container rounded-xl text-left border border-outline-variant text-white"
            >
              Community
            </button>
            <button
              onClick={() => {
                setActiveTab('roadmap');
                setMobileMenuOpen(false);
              }}
              className="p-3 bg-surface-container rounded-xl text-left border border-outline-variant text-white"
            >
              Roadmaps
            </button>
            <button
              onClick={() => {
                setActiveTab('leaderboard');
                setMobileMenuOpen(false);
              }}
              className="p-3 bg-surface-container rounded-xl text-left border border-outline-variant text-white"
            >
              Leaderboard
            </button>
            <button
              onClick={() => {
                setActiveTab('mentors');
                setMobileMenuOpen(false);
              }}
              className="p-3 bg-surface-container rounded-xl text-left border border-outline-variant text-white"
            >
              Mentors
            </button>
            <button
              onClick={() => {
                setActiveTab('admin');
                setMobileMenuOpen(false);
              }}
              className="p-3 bg-surface-container rounded-xl text-left border border-outline-variant text-white"
            >
              Admin Terminal
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
