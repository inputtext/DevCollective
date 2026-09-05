import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth as useClerkAuth, useClerk, useUser } from '@clerk/react';
import { UserProfile, TaskItem, CommunityPost, LeaderboardEntry, Mentor } from '../types';
import { initialTasks, initialPosts, initialLeaderboard, initialMentors } from '../data/initialData';

export type PageTab =
  | 'landing'
  | 'login'
  | 'register'
  | 'profile-setup'
  | 'choose-path'
  | 'dashboard'
  | 'community'
  | 'roadmap'
  | 'leaderboard'
  | 'mentors'
  | 'profile'
  | 'admin';

interface AuthContextType {
  user: UserProfile | null;
  loadingAuth: boolean;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  activeTab: PageTab;
  setActiveTab: (tab: PageTab) => void;
  tasks: TaskItem[];
  posts: CommunityPost[];
  leaderboard: LeaderboardEntry[];
  mentors: Mentor[];
  showOAuthModal: boolean;
  oauthProviderToSimulate: 'google' | 'github' | null;
  setShowOAuthModal: (show: boolean) => void;
  triggerOAuthLogin: (provider: 'google' | 'github') => void;
  showResumePrompt: boolean;
  dismissResumePrompt: () => void;
  loginWithEmail: (email: string, password?: string) => Promise<void>;
  registerUser: (details: Partial<UserProfile> & { password?: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updated: Partial<UserProfile>) => Promise<void>;
  toggleTaskCompletion: (taskId: string) => Promise<void>;
  addPost: (post: Omit<CommunityPost, 'id' | 'authorId' | 'likes' | 'commentsCount' | 'createdAt'>) => void;
  toggleLikePost: (postId: string) => void;
  completeOnboarding: () => Promise<void>;
  repAnimation: { amount: number; id: number } | null;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<void>;
  authRedirectError: string | null;
  clearAuthRedirectError: () => void;
  oauthInfo: {
    googleConfigured: boolean;
    githubConfigured: boolean;
    appUrl: string;
    googleCallbackUrl: string;
    githubCallbackUrl: string;
  } | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const PENDING_REGISTRATION_KEY = 'devcollective_pending_registration';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoaded: clerkLoaded, isSignedIn, getToken } = useClerkAuth();
  const { user: clerkUser } = useUser();
  const clerk = useClerk();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [repAnimation, setRepAnimation] = useState<{ amount: number; id: number } | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() =>
    localStorage.getItem('devcollective_sidebar_collapsed') === 'true'
  );
  const [activeTab, setActiveTab] = useState<PageTab>('landing');
  const [tasks, setTasks] = useState<TaskItem[]>(initialTasks);
  const [posts, setPosts] = useState<CommunityPost[]>(initialPosts);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(initialLeaderboard);
  const [mentors] = useState<Mentor[]>(initialMentors);
  const [showOAuthModal, setShowOAuthModal] = useState(false);
  const [oauthProviderToSimulate, setOauthProviderToSimulate] = useState<'google' | 'github' | null>(null);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [authRedirectError, setAuthRedirectError] = useState<string | null>(null);
  const [oauthInfo] = useState({
    googleConfigured: true,
    githubConfigured: true,
    appUrl: window.location.origin,
    googleCallbackUrl: '',
    githubCallbackUrl: '',
  });

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('devcollective_sidebar_collapsed', String(next));
      return next;
    });
  };

  const apiFetch = useCallback(async (url: string, init: RequestInit = {}) => {
    const token = await getToken();
    if (!token) throw new Error('Not authenticated.');

    const headers = new Headers(init.headers);
    headers.set('Authorization', `Bearer ${token}`);
    if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

    const res = await fetch(url, { ...init, headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Request failed.');
    return data;
  }, [getToken]);

  const syncProfile = useCallback(async () => {
    if (!clerkUser || !isSignedIn) return null;

    let pending: Record<string, unknown> = {};
    const rawPending = sessionStorage.getItem(PENDING_REGISTRATION_KEY);
    if (rawPending) {
      try {
        pending = JSON.parse(rawPending);
      } catch {
        pending = {};
      }
    }

    const data = await apiFetch('/api/auth/sync', {
      method: 'POST',
      body: JSON.stringify(pending),
    });

    sessionStorage.removeItem(PENDING_REGISTRATION_KEY);
    return data.user as UserProfile;
  }, [apiFetch, clerkUser, isSignedIn]);

  useEffect(() => {
    if (!clerkLoaded) return;

    if (!isSignedIn) {
      setUser(null);
      setLoadingAuth(false);
      return;
    }

    let cancelled = false;
    const hydrate = async () => {
      setLoadingAuth(true);
      try {
        const profile = await syncProfile();
        if (!cancelled && profile) {
          setUser(profile);
          setActiveTab((current) => current === 'landing' || current === 'login' || current === 'register' ? 'dashboard' : current);
        }
      } catch (err: any) {
        console.error('Could not load DevCollective profile:', err);
        if (!cancelled) setAuthRedirectError(err.message || 'Could not load your DevCollective profile.');
      } finally {
        if (!cancelled) setLoadingAuth(false);
      }
    };

    hydrate();
    return () => {
      cancelled = true;
    };
  }, [clerkLoaded, isSignedIn, syncProfile]);

  const clearAuthRedirectError = () => setAuthRedirectError(null);

  const triggerOAuthLogin = (provider: 'google' | 'github') => {
    setOauthProviderToSimulate(provider);
    setShowOAuthModal(false);
    clerk.openSignIn({});
  };

  const loginWithEmail = async (email: string, _password?: string) => {
    if (!email) throw new Error('Please enter your email address.');
    // Clerk owns the password, MFA, device trust, OAuth and recovery flows.
    // Opening the Clerk sign-in UI keeps the existing DevCollective route/layout intact.
    clerk.openSignIn({});
  };

  const registerUser = async (details: Partial<UserProfile> & { password?: string }) => {
    if (!details.email || !details.name) {
      throw new Error('Name and email are required for registration.');
    }

    sessionStorage.setItem(
      PENDING_REGISTRATION_KEY,
      JSON.stringify({
        name: details.name,
        role: details.role || 'student',
        college: details.college || 'Institute of Technology',
        branch: details.branch || 'Computer Science',
        academicYear: details.academicYear || '1st Year',
      })
    );

    clerk.openSignUp({});
  };

  const requestPasswordReset = async (_email: string) => {
    // Clerk's hosted sign-in UI owns the complete password-recovery flow.
    clerk.openSignIn({});
  };

  const resetPassword = async () => {
    // Kept for AuthContext API compatibility with the existing login page.
    // Password changes are intentionally handled by Clerk rather than by DevCollective.
    clerk.openSignIn({});
  };

  const logout = async () => {
    await clerk.signOut();
    setUser(null);
    setActiveTab('landing');
  };

  const updateProfile = async (updated: Partial<UserProfile>) => {
    if (!user) return;

    const newProfile = { ...user, ...updated };
    setUser(newProfile);

    try {
      const data = await apiFetch('/api/users/profile', {
        method: 'PATCH',
        body: JSON.stringify(updated),
      });
      if (data.user) setUser(data.user);
    } catch (err) {
      console.error('Error saving profile to Supabase:', err);
    }
  };

  const completeOnboarding = async () => {
    if (!user) return;
    await updateProfile({ hasCompletedOnboarding: true });
  };

  const toggleTaskCompletion = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const isNowCompleted = !task.completed;
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, completed: isNowCompleted } : t)));

    if (user) {
      const repChange = task.repReward || 50;
      const newRep = isNowCompleted ? user.rep + repChange : Math.max(0, user.rep - repChange);
      if (isNowCompleted) setRepAnimation({ amount: repChange, id: Date.now() });
      await updateProfile({ rep: newRep });
    }
  };

  const addPost = (post: Omit<CommunityPost, 'id' | 'authorId' | 'likes' | 'commentsCount' | 'createdAt'>) => {
    if (!user) return;
    const newPost: CommunityPost = {
      ...post,
      id: `post_${Date.now()}`,
      authorId: user.id,
      likes: 1,
      commentsCount: 0,
      createdAt: 'Just now',
      likedByMe: true,
    };
    setPosts([newPost, ...posts]);
    void updateProfile({ rep: user.rep + 25 });
  };

  const toggleLikePost = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, likes: p.likedByMe ? p.likes - 1 : p.likes + 1, likedByMe: !p.likedByMe }
          : p
      )
    );
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loadingAuth,
        sidebarCollapsed,
        toggleSidebar,
        activeTab,
        setActiveTab,
        tasks,
        posts,
        leaderboard,
        mentors,
        showOAuthModal,
        oauthProviderToSimulate,
        setShowOAuthModal,
        triggerOAuthLogin,
        showResumePrompt,
        dismissResumePrompt: () => setShowResumePrompt(false),
        loginWithEmail,
        registerUser,
        logout,
        updateProfile,
        toggleTaskCompletion,
        addPost,
        toggleLikePost,
        completeOnboarding,
        repAnimation,
        requestPasswordReset,
        resetPassword,
        authRedirectError,
        clearAuthRedirectError,
        oauthInfo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
