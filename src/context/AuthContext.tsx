import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth as useClerkAuth, useClerk, useUser, useSignIn } from '@clerk/react';
import { UserProfile, TaskItem, CommunityPost, LeaderboardEntry, Mentor } from '../types';

export type PageTab = 'landing' | 'login' | 'register' | 'profile-setup' | 'choose-path' | 'dashboard' | 'community' | 'roadmap' | 'leaderboard' | 'mentors' | 'profile' | 'admin';
interface AuthContextType {
  user: UserProfile | null; loadingAuth: boolean; sidebarCollapsed: boolean; toggleSidebar: () => void; activeTab: PageTab; setActiveTab: (tab: PageTab) => void;
  tasks: TaskItem[]; posts: CommunityPost[]; leaderboard: LeaderboardEntry[]; mentors: Mentor[];
  showOAuthModal: boolean; oauthProviderToSimulate: 'google' | 'github' | null; setShowOAuthModal: (show: boolean) => void; triggerOAuthLogin: (provider: 'google' | 'github', registrationDetails?: Partial<UserProfile>) => void;
  showResumePrompt: boolean; dismissResumePrompt: () => void;
  loginWithEmail: (email: string, password?: string) => Promise<void>; registerUser: (details: Partial<UserProfile> & { password?: string }) => Promise<void>; logout: () => Promise<void>;
  updateProfile: (updated: Partial<UserProfile>) => Promise<void>; toggleTaskCompletion: (taskId: string) => Promise<void>;
  addPost: (post: Omit<CommunityPost, 'id' | 'authorId' | 'likes' | 'commentsCount' | 'createdAt'>) => void; toggleLikePost: (postId: string) => void; completeOnboarding: () => Promise<void>;
  repAnimation: { amount: number; id: number } | null; requestPasswordReset: (email: string) => Promise<void>; resetPassword: (email: string, code: string, newPassword: string) => Promise<void>;
  authRedirectError: string | null; clearAuthRedirectError: () => void;
  oauthInfo: { googleConfigured: boolean; githubConfigured: boolean; appUrl: string; googleCallbackUrl: string; githubCallbackUrl: string } | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const PENDING_REGISTRATION_KEY = 'devcollective_pending_registration';
const PROFILE_CACHE_PREFIX = 'devcollective_profile_cache:';
const MENTORS_CACHE_KEY = 'devcollective_mentors_cache';
const PROFILE_CACHE_TTL_MS = 60 * 1000;
const MENTORS_CACHE_TTL_MS = 5 * 60 * 1000;
const buildPendingRegistration = (details: Partial<UserProfile>) => ({ name: details.name || '', role: details.role || 'student', college: details.college || '', branch: details.branch || '', academicYear: details.academicYear || '' });

const readStorageJson = <T,>(storage: Storage, key: string): T | null => {
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) as T : null;
  } catch {
    return null;
  }
};

const writeStorageJson = (storage: Storage, key: string, value: unknown) => {
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    // Cache is an optimization only; auth must continue to work without it.
  }
};

const setLandingDestination = (setActiveTab: React.Dispatch<React.SetStateAction<PageTab>>, current: PageTab, profile: UserProfile, isNewRegistration = false) => {
  if (isNewRegistration) {
    setActiveTab('profile-setup');
  } else if (current === 'landing' || current === 'login' || current === 'register') {
    setActiveTab(profile.hasCompletedOnboarding ? 'profile' : 'profile-setup');
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoaded: clerkLoaded, isSignedIn, getToken } = useClerkAuth();
  const { user: clerkUser } = useUser();
  const { signIn } = useSignIn();
  const clerk = useClerk();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [repAnimation, setRepAnimation] = useState<{ amount: number; id: number } | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => localStorage.getItem('devcollective_sidebar_collapsed') === 'true');
  const [activeTab, setActiveTab] = useState<PageTab>('landing');
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [showOAuthModal, setShowOAuthModal] = useState(false);
  const [oauthProviderToSimulate, setOauthProviderToSimulate] = useState<'google' | 'github' | null>(null);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [authRedirectError, setAuthRedirectError] = useState<string | null>(null);
  const [oauthInfo] = useState({ googleConfigured: true, githubConfigured: true, appUrl: window.location.origin, googleCallbackUrl: '', githubCallbackUrl: '' });

  const toggleSidebar = () => setSidebarCollapsed((prev) => { const next = !prev; localStorage.setItem('devcollective_sidebar_collapsed', String(next)); return next; });
  const apiFetch = useCallback(async (url: string, init: RequestInit = {}) => { const token = await getToken(); if (!token) throw new Error('Not authenticated.'); const headers = new Headers(init.headers); headers.set('Authorization', `Bearer ${token}`); if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json'); const res = await fetch(url, { ...init, headers }); const data = await res.json().catch(() => ({})); if (!res.ok) throw new Error(data.error || 'Request failed.'); return data; }, [getToken]);

  const syncProfile = useCallback(async () => {
    if (!clerkUser || !isSignedIn) return null;
    let pending: Record<string, unknown> = {};
    const rawPending = sessionStorage.getItem(PENDING_REGISTRATION_KEY);
    if (rawPending) { try { pending = JSON.parse(rawPending); } catch { pending = {}; } }
    const data = await apiFetch('/api/auth/sync', { method: 'POST', body: JSON.stringify(pending) });
    sessionStorage.removeItem(PENDING_REGISTRATION_KEY);
    return { user: data.user as UserProfile, hadPendingRegistration: Boolean(rawPending) };
  }, [apiFetch, clerkUser, isSignedIn]);

  const loadMentors = useCallback(async () => {
    if (!isSignedIn) { setMentors([]); return; }
    const cached = readStorageJson<{ savedAt: number; mentors: Mentor[] }>(sessionStorage, MENTORS_CACHE_KEY);
    if (cached?.mentors && Date.now() - cached.savedAt < MENTORS_CACHE_TTL_MS) {
      setMentors(cached.mentors);
      return;
    }
    try {
      const data = await apiFetch('/api/mentors');
      const nextMentors = Array.isArray(data.mentors) ? data.mentors : [];
      setMentors(nextMentors);
      writeStorageJson(sessionStorage, MENTORS_CACHE_KEY, { savedAt: Date.now(), mentors: nextMentors });
    } catch (err) {
      console.error('Could not load mentors from Supabase:', err);
      setMentors([]);
    }
  }, [apiFetch, isSignedIn]);

  useEffect(() => {
    if (!clerkLoaded) return;
    if (!isSignedIn || !clerkUser) {
      setUser(null);
      setMentors([]);
      setLoadingAuth(false);
      return;
    }

    let cancelled = false;
    const cacheKey = `${PROFILE_CACHE_PREFIX}${clerkUser.id}`;
    const cached = readStorageJson<{ savedAt: number; user: UserProfile }>(localStorage, cacheKey);
    const cachedUser = cached?.user || null;
    const cacheFresh = Boolean(cached && Date.now() - cached.savedAt < PROFILE_CACHE_TTL_MS);

    // A cached profile lets the workspace render immediately after Clerk restores
    // the session. Supabase remains authoritative and is refreshed in the background.
    if (cachedUser) {
      setUser(cachedUser);
      setLandingDestination(setActiveTab, activeTab, cachedUser);
      setLoadingAuth(false);
    } else {
      setLoadingAuth(true);
    }

    // Fresh cached data does not need a blocking network round-trip on reload.
    if (cacheFresh) {
      void loadMentors();
      return () => { cancelled = true; };
    }

    const hydrate = async () => {
      try {
        const result = await syncProfile();
        if (cancelled) return;
        if (result?.user) {
          setUser(result.user);
          writeStorageJson(localStorage, cacheKey, { savedAt: Date.now(), user: result.user });
          setLandingDestination(setActiveTab, activeTab, result.user, result.hadPendingRegistration);
        }
        // Mentor data is secondary to rendering the current page. Load it independently.
        void loadMentors();
      } catch (err: any) {
        console.error('Could not load DevCollective profile:', err);
        if (!cachedUser) setAuthRedirectError(err.message || 'Could not load your DevCollective profile.');
      } finally {
        if (!cancelled && !cachedUser) setLoadingAuth(false);
      }
    };

    void hydrate();
    return () => { cancelled = true; };
  }, [clerkLoaded, isSignedIn, clerkUser, syncProfile, loadMentors]);

  const clearAuthRedirectError = () => setAuthRedirectError(null);
  const triggerOAuthLogin = (_provider: 'google' | 'github', registrationDetails?: Partial<UserProfile>) => {
    setOauthProviderToSimulate(null); setShowOAuthModal(false);
    if (registrationDetails) { const pending = buildPendingRegistration(registrationDetails); sessionStorage.setItem(PENDING_REGISTRATION_KEY, JSON.stringify(pending)); clerk.openSignUp({ initialValues: registrationDetails.email ? { emailAddress: registrationDetails.email } : undefined, unsafeMetadata: pending, signInFallbackRedirectUrl: '/' }); return; }
    clerk.openSignIn({ signUpFallbackRedirectUrl: '/' });
  };
  const loginWithEmail = async (email: string, password?: string) => {
    if (!email.trim()) throw new Error('Please enter your email address.');
    if (!password) throw new Error('Please enter your password.');
    const { error } = await signIn.password({ emailAddress: email.trim(), password });
    if (error) throw new Error(error.message || 'The email or password is incorrect.');
    if (signIn.status === 'complete') {
      const result = await signIn.finalize({ navigate: ({ decorateUrl }) => { window.location.href = decorateUrl('/'); } });
      if (result.error) throw new Error(result.error.message || 'Could not complete sign in.');
      return;
    }
    throw new Error('Additional verification is required for this account.');
  };
  const registerUser = async (details: Partial<UserProfile> & { password?: string }) => { if (!details.email || !details.name) throw new Error('Name and email are required for registration.'); const pending = buildPendingRegistration(details); sessionStorage.setItem(PENDING_REGISTRATION_KEY, JSON.stringify(pending)); clerk.openSignUp({ initialValues: { emailAddress: details.email }, unsafeMetadata: pending, signInFallbackRedirectUrl: '/' }); };
  const requestPasswordReset = async (_email: string) => { clerk.openSignIn({ signUpFallbackRedirectUrl: '/' }); };
  const resetPassword = async () => { clerk.openSignIn({ signUpFallbackRedirectUrl: '/' }); };
  const logout = async () => { await clerk.signOut({ redirectUrl: '/' }); setUser(null); setMentors([]); setActiveTab('landing'); };

  const updateProfile = async (updated: Partial<UserProfile>) => {
    if (!user) return;
    const optimisticUser = { ...user, ...updated };
    setUser(optimisticUser);
    if (clerkUser?.id) writeStorageJson(localStorage, `${PROFILE_CACHE_PREFIX}${clerkUser.id}`, { savedAt: Date.now(), user: optimisticUser });
    try {
      const data = await apiFetch('/api/users/profile', { method: 'PATCH', body: JSON.stringify(updated) });
      if (data.user) {
        setUser(data.user);
        if (clerkUser?.id) writeStorageJson(localStorage, `${PROFILE_CACHE_PREFIX}${clerkUser.id}`, { savedAt: Date.now(), user: data.user });
      }
    } catch (err) { console.error('Error saving profile to Supabase:', err); }
  };
  const completeOnboarding = async () => { if (user) await updateProfile({ hasCompletedOnboarding: true }); };
  const toggleTaskCompletion = async (taskId: string) => { const task = tasks.find((t) => t.id === taskId); if (!task) return; const isNowCompleted = !task.completed; setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, completed: isNowCompleted } : t)); if (user) { const repChange = task.repReward || 50; const newRep = isNowCompleted ? user.rep + repChange : Math.max(0, user.rep - repChange); if (isNowCompleted) setRepAnimation({ amount: repChange, id: Date.now() }); await updateProfile({ rep: newRep }); } };
  const addPost = (post: Omit<CommunityPost, 'id' | 'authorId' | 'likes' | 'commentsCount' | 'createdAt'>) => { if (!user) return; const newPost: CommunityPost = { ...post, id: `post_${Date.now()}`, authorId: user.id, likes: 0, commentsCount: 0, createdAt: new Date().toLocaleString(), likedByMe: false }; setPosts((prev) => [newPost, ...prev]); };
  const toggleLikePost = (postId: string) => setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, likes: p.likedByMe ? Math.max(0, p.likes - 1) : p.likes + 1, likedByMe: !p.likedByMe } : p));

  return <AuthContext.Provider value={{ user, loadingAuth, sidebarCollapsed, toggleSidebar, activeTab, setActiveTab, tasks, posts, leaderboard, mentors, showOAuthModal, oauthProviderToSimulate, setShowOAuthModal, triggerOAuthLogin, showResumePrompt, dismissResumePrompt: () => setShowResumePrompt(false), loginWithEmail, registerUser, logout, updateProfile, toggleTaskCompletion, addPost, toggleLikePost, completeOnboarding, repAnimation, requestPasswordReset, resetPassword, authRedirectError, clearAuthRedirectError, oauthInfo }}>{children}</AuthContext.Provider>;
};
export const useAuth = () => { const context = useContext(AuthContext); if (!context) throw new Error('useAuth must be used within an AuthProvider'); return context; };
