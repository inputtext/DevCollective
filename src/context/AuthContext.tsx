import React, { createContext, useContext, useState, useEffect } from 'react';
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loadingAuth, setLoadingAuth] = useState<boolean>(true);
  const [repAnimation, setRepAnimation] = useState<{ amount: number; id: number } | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('devcollective_sidebar_collapsed') === 'true';
  });

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('devcollective_sidebar_collapsed', String(next));
      return next;
    });
  };

  const [activeTab, setActiveTab] = useState<PageTab>('landing');
  const [tasks, setTasks] = useState<TaskItem[]>(initialTasks);
  const [posts, setPosts] = useState<CommunityPost[]>(initialPosts);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(initialLeaderboard);
  const [mentors] = useState<Mentor[]>(initialMentors);

  const [showOAuthModal, setShowOAuthModal] = useState(false);
  const [oauthProviderToSimulate, setOauthProviderToSimulate] = useState<'google' | 'github' | null>(null);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const dismissResumePrompt = () => setShowResumePrompt(false);
  const [authRedirectError, setAuthRedirectError] = useState<string | null>(null);
  const [oauthInfo, setOauthInfo] = useState<{
    googleConfigured: boolean;
    githubConfigured: boolean;
    appUrl: string;
    googleCallbackUrl: string;
    githubCallbackUrl: string;
  } | null>(null);

  // Check persistent session token on app initialization.
  // Also handles landing back here after a real Google/GitHub OAuth redirect, which
  // arrives as ?token=...&newUser=1 (success) or ?authError=... (failure) in the URL.
  useEffect(() => {
    const checkSession = async () => {
      const params = new URLSearchParams(window.location.search);
      const redirectToken = params.get('token');
      const isNewUser = params.get('newUser') === '1';
      const redirectError = params.get('authError');

      if (redirectError) {
        setAuthRedirectError(redirectError);
        window.history.replaceState({}, '', window.location.pathname);
      }

      const token = redirectToken || localStorage.getItem('devcollective_token');

      if (redirectToken) {
        localStorage.setItem('devcollective_token', redirectToken);
        window.history.replaceState({}, '', window.location.pathname);
      }

      if (!token) {
        setLoadingAuth(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setUser(data.user);
            if (redirectToken) {
              setActiveTab('dashboard');
              if (isNewUser) setShowResumePrompt(true);
            }
          } else {
            localStorage.removeItem('devcollective_token');
            setUser(null);
          }
        } else {
          localStorage.removeItem('devcollective_token');
          setUser(null);
        }
      } catch (err) {
        console.error('Unexpected error checking session:', err);
        setUser(null);
      } finally {
        setLoadingAuth(false);
      }
    };

    checkSession();
  }, []);

  const clearAuthRedirectError = () => setAuthRedirectError(null);

  // Fetch Auth Status Info from Express Server
  useEffect(() => {
    fetch('/api/auth/info')
      .then((res) => res.json())
      .then((data) => setOauthInfo(data))
      .catch((err) => console.warn('Could not fetch Auth info from server', err));
  }, []);

  // Kicks off a real Google/GitHub OAuth flow when configured; otherwise shows the
  // setup guide so it's obvious what env vars are still needed.
  const triggerOAuthLogin = (provider: 'google' | 'github') => {
    const isConfigured = provider === 'google' ? oauthInfo?.googleConfigured : oauthInfo?.githubConfigured;
    if (isConfigured) {
      window.location.href = `/api/auth/${provider}`;
      return;
    }
    setOauthProviderToSimulate(provider);
    setShowOAuthModal(true);
  };

  // 1. Native Email/Password Login
  const loginWithEmail = async (email: string, password?: string) => {
    if (!email || !password) {
      throw new Error('Please enter both email and password.');
    }

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Login failed.');
    }

    if (data.token) {
      localStorage.setItem('devcollective_token', data.token);
    }
    setUser(data.user);
    setActiveTab('dashboard');
  };

  // 2. Native User Registration
  const registerUser = async (details: Partial<UserProfile> & { password?: string }) => {
    if (!details.email || !details.password || !details.name) {
      throw new Error('Name, email, and password are required for registration.');
    }

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: details.name,
        email: details.email,
        password: details.password,
        role: details.role || 'student',
        college: details.college,
        branch: details.branch,
        academicYear: details.academicYear,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Registration failed.');
    }

    if (data.token) {
      localStorage.setItem('devcollective_token', data.token);
    }
    setUser(data.user);
    setActiveTab('profile-setup');
    setShowResumePrompt(true);
  };

  // 3. Forgot Password & Reset via DevCollective Email SMTP
  const requestPasswordReset = async (email: string) => {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Could not send the reset code.');
    }
  };

  const resetPassword = async (email: string, code: string, newPassword: string) => {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code, newPassword }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Could not reset the password.');
    }
  };

  // 4. Logout
  const logout = async () => {
    const token = localStorage.getItem('devcollective_token');
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.warn('Logout request failed', err);
      }
      localStorage.removeItem('devcollective_token');
    }

    setUser(null);
    setActiveTab('landing');
  };

  // 5. Update Profile
  const updateProfile = async (updated: Partial<UserProfile>) => {
    if (!user) return;

    // Optimistic local update so the UI feels instant
    const newProfile = { ...user, ...updated };
    setUser(newProfile);

    const token = localStorage.getItem('devcollective_token');
    if (!token) return;

    try {
      const res = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updated),
      });

      const data = await res.json();
      if (res.ok && data.user) {
        setUser(data.user);
      } else {
        console.error('Failed to persist profile update to server:', data.error);
      }
    } catch (err) {
      console.error('Error saving profile to server:', err);
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

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: isNowCompleted } : t))
    );

    if (user) {
      const repChange = task.repReward || 50;
      const newRep = isNowCompleted ? user.rep + repChange : Math.max(0, user.rep - repChange);
      if (isNowCompleted) {
        setRepAnimation({ amount: repChange, id: Date.now() });
      }
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
    const updatedRep = user.rep + 25;
    updateProfile({ rep: updatedRep });
  };

  const toggleLikePost = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const isLiked = p.likedByMe;
          return {
            ...p,
            likes: isLiked ? p.likes - 1 : p.likes + 1,
            likedByMe: !isLiked,
          };
        }
        return p;
      })
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
        dismissResumePrompt,
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
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
