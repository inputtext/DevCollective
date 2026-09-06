/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { lazy, Suspense, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { OAuthGuideModal } from './components/OAuthGuideModal';
import { ChatWidget } from './components/ChatWidget';
import { ResumeUploadPromptModal } from './components/ResumeUploadPromptModal';
import { MotionSystem } from './components/MotionSystem';
import './styles/profile-setup.css';
import './styles/login.css';
import './styles/login-modern.css';
import './styles/profile-setup-theme.css';
import './styles/workspace-pastel.css';

const LandingPage = lazy(() => import('./pages/LandingPage').then((module) => ({ default: module.LandingPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then((module) => ({ default: module.LoginPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage').then((module) => ({ default: module.RegisterPage })));
const ProfileSetupPage = lazy(() => import('./pages/ProfileSetupPage').then((module) => ({ default: module.ProfileSetupPage })));
const ChoosePathPage = lazy(() => import('./pages/ChoosePathPage').then((module) => ({ default: module.ChoosePathPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((module) => ({ default: module.DashboardPage })));
const CommunityPage = lazy(() => import('./pages/CommunityPage').then((module) => ({ default: module.CommunityPage })));
const RoadmapPage = lazy(() => import('./pages/RoadmapPage').then((module) => ({ default: module.RoadmapPage })));
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage').then((module) => ({ default: module.LeaderboardPage })));
const MentorDirectoryPage = lazy(() => import('./pages/MentorDirectoryPage').then((module) => ({ default: module.MentorDirectoryPage })));
const StudentProfilePage = lazy(() => import('./pages/StudentProfilePage').then((module) => ({ default: module.StudentProfilePage })));
const AdminPage = lazy(() => import('./pages/AdminPage').then((module) => ({ default: module.AdminPage })));

const PageLoadingFallback: React.FC = () => (
  <div className="min-h-[50vh] bg-background text-on-background flex items-center justify-center p-6">
    <div className="flex items-center gap-3 border-2 border-outline-variant bg-surface px-5 py-4 dc-hard-shadow-sm">
      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      <span className="font-label-mono text-[10px] uppercase tracking-wider">Loading module...</span>
    </div>
  </div>
);

const MainContent: React.FC = () => {
  const { user, loadingAuth, activeTab, setActiveTab } = useAuth();
  const wasAuthenticatedRef = React.useRef(false);

  useEffect(() => {
    if (loadingAuth) return;
    const isAuthenticated = Boolean(user);
    if (!wasAuthenticatedRef.current && isAuthenticated && activeTab === 'landing') setActiveTab('profile');
    wasAuthenticatedRef.current = isAuthenticated;
  }, [user, loadingAuth, activeTab, setActiveTab]);

  const publicTabs = ['landing', 'login', 'register'];
  const protectedTabs = ['dashboard', 'community', 'roadmap', 'leaderboard', 'mentors', 'profile', 'admin'];
  const isProtected = protectedTabs.includes(activeTab);
  const needsAuthHydration = !publicTabs.includes(activeTab);

  if (loadingAuth && needsAuthHydration) {
    return (
      <div className="dc-app-shell min-h-screen bg-background text-on-background flex flex-col items-center justify-center p-6 space-y-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="font-label-mono text-sm text-on-surface-variant">Verifying DevCollective session...</p>
      </div>
    );
  }

  if (isProtected && !user) {
    return (
      <div className="dc-app-shell min-h-screen bg-background text-on-background">
        <Navbar />
        <div className="max-w-md mx-auto mt-12 p-6 bg-surface-container border-2 border-outline-variant rounded-xl text-center space-y-4">
          <h2 className="font-headline-md text-2xl font-bold">Authentication Required</h2>
          <p className="text-sm text-on-surface-variant">Please log in with your email and password to access this page.</p>
          <button onClick={() => setActiveTab('login')} className="w-full py-3 bg-primary text-on-primary font-bold border-2 border-outline-variant dc-hard-shadow-sm">Go to Login</button>
        </div>
      </div>
    );
  }

  if (activeTab === 'admin' && user?.role !== 'admin') {
    return (
      <div className="dc-app-shell min-h-screen bg-background text-on-background flex flex-col md:flex-row">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0"><Navbar /><main className="flex-1 p-6 md:p-10 min-w-0">
          <div className="max-w-xl mx-auto p-8 bg-surface-container border-2 border-outline-variant rounded-xl text-center space-y-4 dc-hard-shadow-sm">
            <div className="w-16 h-16 bg-dc-pink border-2 border-outline-variant flex items-center justify-center mx-auto font-bold text-xl">403</div>
            <h2 className="font-headline-md text-2xl font-bold">Access Denied</h2>
            <p className="text-sm text-on-surface-variant">The Admin portal is restricted to users with the <span className="font-bold uppercase">Admin</span> role. Your current role is <span className="font-bold text-primary uppercase">{user?.role}</span>.</p>
            <button onClick={() => setActiveTab('dashboard')} className="px-6 py-3 bg-surface border-2 border-outline-variant font-bold dc-hard-shadow-sm">Return to Dashboard</button>
          </div>
        </main></div>
      </div>
    );
  }

  const isFullLayout = ['landing', 'login', 'register', 'profile-setup', 'choose-path'].includes(activeTab);
  return (
    <div className="dc-app-shell min-h-screen bg-background text-on-background flex flex-col md:flex-row">
      <MotionSystem />
      {!isFullLayout && <Sidebar />}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className={`flex-1 min-w-0 dc-page-${activeTab} ${isFullLayout ? 'w-full' : 'p-4 sm:p-8 lg:p-10'}`}>
          <Suspense fallback={<PageLoadingFallback />}>
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
          </Suspense>
        </main>
      </div>
      <OAuthGuideModal />
      {user && <ChatWidget />}
      {user && <ResumeUploadPromptModal />}
    </div>
  );
};

export default function App() {
  return <AuthProvider><MainContent /></AuthProvider>;
}
