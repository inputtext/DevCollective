import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, TaskItem, CommunityPost, LeaderboardEntry, Mentor } from '../types';
import { initialUserProfile, initialTasks, initialPosts, initialLeaderboard, initialMentors } from '../data/initialData';

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
  triggerOAuthLogin: (provider: 'google' | 'github') => Promise<void>;
  simulateOAuthSuccess: (provider: 'google' | 'github', userDetails?: { name?: string; email?: string; avatar?: string }) => void;
  loginWithEmail: (email: string, password?: string) => Promise<void>;
  registerUser: (details: Partial<UserProfile> & { password?: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updated: Partial<UserProfile>) => void;
  toggleTaskCompletion: (taskId: string) => void;
  addPost: (post: Omit<CommunityPost, 'id' | 'authorId' | 'likes' | 'commentsCount' | 'createdAt'>) => void;
  toggleLikePost: (postId: string) => void;
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
  const [oauthInfo, setOauthInfo] = useState<{
    googleConfigured: boolean;
    githubConfigured: boolean;
    appUrl: string;
    googleCallbackUrl: string;
    githubCallbackUrl: string;
  } | null>(null);

  // Check persistent session token on app initialization
  useEffect(() => {
    const checkSession = async () => {
      const token = localStorage.getItem('devcollective_token');
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
          } else {
            localStorage.removeItem('devcollective_token');
          }
        } else {
          localStorage.removeItem('devcollective_token');
        }
      } catch (err) {
        console.error('Error verifying session token:', err);
        localStorage.removeItem('devcollective_token');
      } finally {
        setLoadingAuth(false);
      }
    };

    checkSession();
  }, []);

  // Fetch Auth Status Info from Express Server
  useEffect(() => {
    fetch('/api/auth/info')
      .then((res) => res.json())
      .then((data) => setOauthInfo(data))
      .catch((err) => console.warn('Could not fetch Auth info from server', err));
  }, []);

  const triggerOAuthLogin = async (provider: 'google' | 'github') => {
    setOauthProviderToSimulate(provider);
    setShowOAuthModal(true);
  };

  const simulateOAuthSuccess = (
    provider: 'google' | 'github',
    userDetails?: { name?: string; email?: string; avatar?: string }
  ) => {
    const defaultName = provider === 'google' ? 'Piyush Kanojiya' : 'Piyush Kanojiya';
    const defaultEmail = provider === 'google' ? 'kanojiyapk524@gmail.com' : 'kanojiyapk@github.com';

    const newUser: UserProfile = {
      id: `user_${Date.now()}`,
      name: userDetails?.name || defaultName,
      email: userDetails?.email || defaultEmail,
      role: 'student',
      college: 'Institute of Technology',
      branch: 'Computer Science',
      academicYear: 'Third Year',
      avatar: userDetails?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      bio: `Student developer building on DevCollective.`,
      rep: 2500,
      level: 18,
      streakDays: 42,
      githubUrl: 'https://github.com/kanojiyapk',
      linkedinUrl: 'https://linkedin.com/in/student-developer',
      skills: ['React', 'TypeScript', 'Node.js', 'Python', 'AI/ML'],
      selectedDomains: ['Software Dev', 'AI/ML'],
      authProvider: provider,
      createdAt: new Date().toISOString(),
    };

    setUser(newUser);
    setShowOAuthModal(false);
    setActiveTab('dashboard');
  };

  const loginWithEmail = async (email: string, password?: string) => {
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

  const registerUser = async (details: Partial<UserProfile> & { password?: string }) => {
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
  };

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
    }
    localStorage.removeItem('devcollective_token');
    setUser(null);
    setActiveTab('landing');
  };

  const updateProfile = (updated: Partial<UserProfile>) => {
    if (!user) return;
    const newProfile = { ...user, ...updated };
    setUser(newProfile);
  };

  const toggleTaskCompletion = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const isNowCompleted = !t.completed;
          if (isNowCompleted && user) {
            setUser((u) => (u ? { ...u, rep: u.rep + t.repReward } : null));
          } else if (!isNowCompleted && user) {
            setUser((u) => (u ? { ...u, rep: Math.max(0, u.rep - t.repReward) } : null));
          }
          return { ...t, completed: isNowCompleted };
        }
        return t;
      })
    );
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
    // Reward REP for posting!
    setUser((u) => (u ? { ...u, rep: u.rep + 25 } : null));
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
        simulateOAuthSuccess,
        loginWithEmail,
        registerUser,
        logout,
        updateProfile,
        toggleTaskCompletion,
        addPost,
        toggleLikePost,
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
