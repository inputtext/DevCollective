/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { OAuthGuideModal } from './components/OAuthGuideModal';

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

const MainContent: React.FC = () => {
  const { user, loadingAuth, activeTab, setActiveTab } = useAuth();

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

  const protectedTabs = ['dashboard', 'community', 'roadmap', 'leaderboard', 'mentors', 'profile', 'admin'];
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
          {activeTab === 'admin' && <AdminPage />}
        </main>
      </div>

      <OAuthGuideModal />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}
