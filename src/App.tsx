/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';

import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { OAuthGuideModal } from './components/OAuthGuideModal';
import { ChatWidget } from './components/ChatWidget';
import { ResumeUploadPromptModal } from './components/ResumeUploadPromptModal';

import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ProfileSetupPage } from './pages/ProfileSetupPage';
import { ChoosePathPage } from './pages/ChoosePathPage';
import { DashboardPage } from './pages/DashboardPage';
import { CommunityPage } from './pages/CommunityPage';
import { RoadmapPage } from './pages/RoadmapPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { MentorDirectoryPage } from './pages/MentorDirectoryPage';
import { StudentProfilePage } from './pages/StudentProfilePage';
import { AdminPage } from './pages/AdminPage';
import { Level0Page } from './pages/Level0Page';

/**
 * Compatibility bridge for the existing Level0Page UI.
 *
 * Level0Page currently writes its visual progress snapshot to localStorage.
 * This bridge keeps that UI unchanged while making every newly verified
 * checkpoint go through the authoritative server/Supabase completion RPC.
 */
const Level0ProgressBridge: React.FC = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem('devcollective_token');
    if (!token) return;

    const key = `devcollective_level_progress_${user.id}`;
    const originalSetItem = Storage.prototype.setItem;
    let serverProgress: Record<string, Set<string>> = {};
    let syncing = false;
    let queue = Promise.resolve();

    const loadServerProgress = async () => {
      try {
        const response = await fetch('/api/learning/level-0', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) return;

        const data = await response.json();
        const submoduleToModule = new Map<string, string>(
          (Array.isArray(data.submodules) ? data.submodules : []).map((submodule: any) => [submodule.id, submodule.module_id])
        );
        const next: Record<string, Set<string>> = {};

        for (const item of Array.isArray(data.progress) ? data.progress : []) {
          const moduleId = submoduleToModule.get(item.submodule_id);
          if (!moduleId) continue;
          if (!next[moduleId]) next[moduleId] = new Set<string>();
          next[moduleId].add(item.submodule_id);
        }

        serverProgress = next;

        const modules = Array.isArray(data.modules) ? data.modules : [];
        const moduleProgress = Array.isArray(data.moduleProgress) ? data.moduleProgress : [];
        const snapshot: Record<string, { verifiedSubmodules: string[]; completedAt?: string }> = {};

        for (const module of modules) {
          const verified = Array.from(next[module.id] ?? []);
          const persistedModule = moduleProgress.find((item: any) => item.module_id === module.id);
          snapshot[module.id] = {
            verifiedSubmodules: verified,
            ...(persistedModule?.completed_at ? { completedAt: persistedModule.completed_at } : {}),
          };
        }

        syncing = true;
        originalSetItem.call(localStorage, key, JSON.stringify(snapshot));
        syncing = false;
      } catch (error) {
        console.warn('Could not sync Level 0 progress from server:', error);
      }
    };

    const syncNewCheckpoint = (nextRaw: string) => {
      if (syncing) return;

      let nextSnapshot: Record<string, { verifiedSubmodules?: string[] }>;
      try {
        nextSnapshot = JSON.parse(nextRaw);
      } catch {
        return;
      }

      const newSubmodules: string[] = [];
      for (const module of Object.values(nextSnapshot)) {
        for (const submoduleId of module.verifiedSubmodules ?? []) {
          const alreadyVerified = Object.values(serverProgress).some((ids) => ids.has(submoduleId));
          if (!alreadyVerified) newSubmodules.push(submoduleId);
        }
      }

      if (newSubmodules.length === 0) return;

      queue = queue.then(async () => {
        for (const submoduleId of newSubmodules) {
          try {
            const response = await fetch(`/api/learning/level-0/submodules/${encodeURIComponent(submoduleId)}/verify`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) {
              console.error('Level 0 checkpoint verification failed:', await response.text());
              continue;
            }

            const result = await response.json();
            const authoritative = result?.progress;
            if (authoritative) {
              for (const [moduleId, ids] of Object.entries(authoritative)) {
                if (!serverProgress[moduleId]) serverProgress[moduleId] = new Set<string>();
                for (const id of ids as string[]) serverProgress[moduleId].add(id);
              }
            } else {
              for (const [moduleId, module] of Object.entries(nextSnapshot)) {
                for (const id of module.verifiedSubmodules ?? []) {
                  if (!serverProgress[moduleId]) serverProgress[moduleId] = new Set<string>();
                  serverProgress[moduleId].add(id);
                }
              }
            }
          } catch (error) {
            console.error('Error verifying Level 0 checkpoint:', error);
          }
        }

        await loadServerProgress();
      });
    };

    const bridgedSetItem = function (this: Storage, storageKey: string, value: string) {
      originalSetItem.call(this, storageKey, value);
      if (storageKey === key) syncNewCheckpoint(value);
    };

    Storage.prototype.setItem = bridgedSetItem;
    void loadServerProgress();

    return () => {
      Storage.prototype.setItem = originalSetItem;
    };
  }, [user]);

  return null;
};

const MainContent: React.FC = () => {
  const { user, loadingAuth, activeTab, setActiveTab } = useAuth();

  const wasAuthenticatedRef = React.useRef(false);

  useEffect(() => {
    if (loadingAuth) return;

    const isAuthenticated = Boolean(user);

    if (!wasAuthenticatedRef.current && isAuthenticated) {
      if (activeTab === 'landing') {
        setActiveTab('dashboard');
      }
    }

    wasAuthenticatedRef.current = isAuthenticated;
  }, [user, loadingAuth, activeTab, setActiveTab]);

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-background text-on-background flex flex-col items-center justify-center p-6 space-y-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="font-label-mono text-sm text-on-surface-variant">
          Verifying DevCollective session...
        </p>
      </div>
    );
  }

  const protectedTabs = ['dashboard', 'community', 'roadmap', 'leaderboard', 'mentors', 'profile', 'level-0', 'admin'];
  const isProtected = protectedTabs.includes(activeTab);

  if (isProtected && !user) {
    return (
      <div className="min-h-screen bg-background text-on-background">
        <Navbar />
        <div className="max-w-md mx-auto mt-12 p-6 bg-surface-container border-2 border-outline-variant rounded-2xl text-center space-y-4">
          <h2 className="font-headline-md text-2xl font-bold text-white">Authentication Required</h2>
          <p className="text-sm text-on-surface-variant">
            Please log in with your email and password to access this page.
          </p>
          <button
            onClick={() => setActiveTab('login')}
            className="w-full py-3 bg-gradient-to-r from-primary-container to-secondary-container text-white font-bold rounded-xl shadow-lg hover:brightness-110 transition-all"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (activeTab === 'admin' && user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background text-on-background flex flex-col md:flex-row">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Navbar />
          <main className="flex-1 p-6 md:p-10 min-w-0">
            <div className="max-w-xl mx-auto p-8 bg-surface-container border-2 border-error/40 rounded-2xl text-center space-y-4">
              <div className="w-16 h-16 bg-error/10 border-2 border-error/40 rounded-full flex items-center justify-center mx-auto text-error font-bold text-xl">
                403
              </div>
              <h2 className="font-headline-md text-2xl font-bold text-white">Access Denied</h2>
              <p className="text-sm text-on-surface-variant">
                The Admin portal is restricted to users with the <span className="font-bold text-error uppercase">Admin</span> role. Your current role is <span className="font-bold text-primary uppercase">{user?.role}</span>.
              </p>
              <button
                onClick={() => setActiveTab('dashboard')}
                className="px-6 py-3 bg-surface-container-high border border-outline-variant hover:border-primary text-white font-bold rounded-xl transition-all"
              >
                Return to Dashboard
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const isFullLayout = ['landing', 'login', 'register', 'profile-setup', 'choose-path'].includes(
    activeTab
  );

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col md:flex-row">
      {!isFullLayout && <Sidebar />}

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />

        <main className={`flex-1 min-w-0 ${isFullLayout ? 'w-full' : 'p-4 sm:p-8 lg:p-10'}`}>
          {activeTab === 'landing' && <LandingPage />}
          {activeTab === 'login' && <LoginPage />}
          {activeTab === 'register' && <RegisterPage />}
          {activeTab === 'profile-setup' && <ProfileSetupPage />}
          {activeTab === 'choose-path' && <ChoosePathPage />}
          {activeTab === 'dashboard' && <DashboardPage />}
          {activeTab === 'community' && <CommunityPage />}
          {activeTab === 'roadmap' && <RoadmapPage />}
          {activeTab === 'leaderboard' && <LeaderboardPage />}
          {activeTab === 'mentors' && <MentorDirectoryPage />}
          {activeTab === 'profile' && <StudentProfilePage />}
          {activeTab === 'level-0' && <Level0Page />}
          {activeTab === 'admin' && <AdminPage />}
        </main>
      </div>

      <OAuthGuideModal />
      {user && <ChatWidget />}
      {user && <ResumeUploadPromptModal />}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Level0ProgressBridge />
      <MainContent />
    </AuthProvider>
  );
}
