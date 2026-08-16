import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { UserProfile, UserRole, TaskItem, CommunityPost, LeaderboardEntry, Mentor } from '../types';
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
  toggleTaskCompletion: (taskId: string) => Promise<void>;
  addPost: (post: Omit<CommunityPost, 'id' | 'authorId' | 'likes' | 'commentsCount' | 'createdAt'>) => void;
  toggleLikePost: (postId: string) => void;
  completeOnboarding: () => Promise<void>;
  repAnimation: { amount: number; id: number } | null;
  oauthInfo: {
    googleConfigured: boolean;
    githubConfigured: boolean;
    appUrl: string;
    googleCallbackUrl: string;
    githubCallbackUrl: string;
  } | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to map Supabase Auth User object to default UserProfile structure
const mapSupabaseUserToProfile = (supabaseUser: User): UserProfile => {
  const metadata = supabaseUser.user_metadata || {};
  return {
    id: supabaseUser.id,
    name: metadata.name || supabaseUser.email?.split('@')[0] || 'Developer',
    email: supabaseUser.email || '',
    role: (metadata.role as UserRole) || 'student',
    college: metadata.college || 'Institute of Technology',
    branch: metadata.branch || 'Computer Science',
    academicYear: metadata.academicYear || metadata.academic_year || 'Third Year',
    avatar: metadata.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    bio: 'Student developer building on DevCollective.',
    rep: 0,
    level: 0,
    streakDays: 0,
    hasCompletedOnboarding: false,
    githubUrl: 'https://github.com/kanojiyapk',
    linkedinUrl: 'https://linkedin.com/in/student-developer',
    skills: ['React', 'TypeScript', 'Node.js', 'Python', 'AI/ML'],
    selectedDomains: ['Software Dev', 'AI/ML'],
    authProvider: 'email',
    createdAt: supabaseUser.created_at || new Date().toISOString(),
  };
};

// Fetch user profile from public.profiles database table
const fetchProfileFromSupabase = async (userId: string): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return {
      id: data.user_id,
      name: data.name || 'Developer',
      email: data.email || '',
      role: (data.role as UserRole) || 'student',
      college: data.college || 'Institute of Technology',
      branch: data.branch || 'Computer Science',
      academicYear: data.academic_year || 'Third Year',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      bio: 'Student developer building on DevCollective.',
      rep: data.rep ?? 0,
      level: data.level ?? 0,
      streakDays: data.streak_days ?? 0,
      hasCompletedOnboarding: data.has_completed_onboarding ?? false,
      githubUrl: 'https://github.com/kanojiyapk',
      linkedinUrl: 'https://linkedin.com/in/student-developer',
      skills: ['React', 'TypeScript', 'Node.js', 'Python', 'AI/ML'],
      selectedDomains: ['Software Dev', 'AI/ML'],
      authProvider: 'email',
      createdAt: data.created_at || new Date().toISOString(),
    };
  } catch (err) {
    console.error('Error fetching profile from Supabase:', err);
    return null;
  }
};

// Fetch or initialize user profile from DB or fallback
const getOrFetchProfile = async (supabaseUser: User): Promise<UserProfile> => {
  const existingProfile = await fetchProfileFromSupabase(supabaseUser.id);
  if (existingProfile) {
    return existingProfile;
  }

  // Fallback profile creation if trigger hasn't completed or table direct upsert is enabled
  const metadata = supabaseUser.user_metadata || {};
  const newProfileData = {
    user_id: supabaseUser.id,
    name: metadata.name || supabaseUser.email?.split('@')[0] || 'Developer',
    email: supabaseUser.email || '',
    role: metadata.role || 'student',
    college: metadata.college || 'Institute of Technology',
    branch: metadata.branch || 'Computer Science',
    academic_year: metadata.academicYear || metadata.academic_year || 'Third Year',
    rep: 0,
    level: 0,
    streak_days: 0,
    has_completed_onboarding: false,
  };

  try {
    const { data } = await supabase
      .from('profiles')
      .upsert(newProfileData, { onConflict: 'user_id' })
      .select()
      .maybeSingle();

    if (data) {
      return {
        id: data.user_id,
        name: data.name,
        email: data.email,
        role: data.role as UserRole,
        college: data.college,
        branch: data.branch,
        academicYear: data.academic_year,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        bio: 'Student developer building on DevCollective.',
        rep: data.rep ?? 0,
        level: data.level ?? 0,
        streakDays: data.streak_days ?? 0,
        hasCompletedOnboarding: data.has_completed_onboarding ?? false,
        githubUrl: 'https://github.com/kanojiyapk',
        linkedinUrl: 'https://linkedin.com/in/student-developer',
        skills: ['React', 'TypeScript', 'Node.js', 'Python', 'AI/ML'],
        selectedDomains: ['Software Dev', 'AI/ML'],
        authProvider: 'email',
        createdAt: data.created_at || new Date().toISOString(),
      };
    }
  } catch (err) {
    console.warn('Profile upsert fallback warning:', err);
  }

  return mapSupabaseUserToProfile(supabaseUser);
};

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
  const [oauthInfo, setOauthInfo] = useState<{
    googleConfigured: boolean;
    githubConfigured: boolean;
    appUrl: string;
    googleCallbackUrl: string;
    githubCallbackUrl: string;
  } | null>(null);

  // 1. Initial Session Check & Subscription using Supabase Auth
  useEffect(() => {
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error fetching Supabase session:', error);
        }
        if (session?.user) {
          const profile = await getOrFetchProfile(session.user);
          setUser(profile);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Unexpected error checking session:', err);
      } finally {
        setLoadingAuth(false);
      }
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const profile = await getOrFetchProfile(session.user);
        setUser(profile);
      } else {
        setUser(null);
      }
      setLoadingAuth(false);
    });

    return () => {
      subscription.unsubscribe();
    };
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
      hasCompletedOnboarding: true,
      createdAt: new Date().toISOString(),
    };

    setUser(newUser);
    setShowOAuthModal(false);
    setActiveTab('dashboard');
  };

  // 2. Login using Supabase Auth
  const loginWithEmail = async (email: string, password?: string) => {
    if (!password) {
      throw new Error('Password is required for login.');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    if (data.user) {
      const profile = await getOrFetchProfile(data.user);
      setUser(profile);
      setActiveTab('dashboard');
    }
  };

  // 3. Registration using Supabase Auth
  const registerUser = async (details: Partial<UserProfile> & { password?: string }) => {
    if (!details.email || !details.password) {
      throw new Error('Email and password are required for registration.');
    }

    const { data, error } = await supabase.auth.signUp({
      email: details.email,
      password: details.password,
      options: {
        data: {
          name: details.name,
          role: details.role || 'student',
          college: details.college,
          branch: details.branch,
          academicYear: details.academicYear,
        },
        // Redirect after email confirmation to the app origin
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      throw error;
    }

    if (data.user && data.session) {
      const profile = await getOrFetchProfile(data.user);
      setUser(profile);
      setActiveTab('profile-setup');
    } else if (data.user && !data.session) {
      // Email confirmation required — resolve normally so the caller
      // can treat this as a success (not an error).
      return;
    } else {
      throw new Error('Registration failed.');
    }
  };

  // 5. Logout using Supabase Auth
  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.warn('Supabase signout warning:', error);
    }
    setUser(null);
    setActiveTab('landing');
  };

  const updateProfile = (updated: Partial<UserProfile>) => {
    if (!user) return;
    const newProfile = { ...user, ...updated };
    setUser(newProfile);
  };

  const completeOnboarding = async () => {
    if (!user) return;
    try {
      await supabase
        .from('profiles')
        .update({ has_completed_onboarding: true, updated_at: new Date().toISOString() })
        .eq('user_id', user.id);
    } catch (err) {
      console.warn('Complete onboarding DB update warning:', err);
    }
    setUser((prev) => (prev ? { ...prev, hasCompletedOnboarding: true } : null));
  };

  const awardTaskRep = async (taskId: string, repAmount: number = 50): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data: newRep, error } = await supabase.rpc('award_rep', {
        p_task_id: taskId,
      });

      if (!error && typeof newRep === 'number') {
        const repIncreased = newRep > user.rep;
        setUser((u) => (u ? { ...u, rep: newRep } : null));
        return repIncreased;
      }
    } catch (err) {
      console.warn('RPC award_rep execution warning:', err);
    }

    // Fallback if RPC call not initialized yet in DB
    setUser((u) => (u ? { ...u, rep: u.rep + repAmount } : null));
    return true;
  };

  const toggleTaskCompletion = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const isNowCompleted = !task.completed;

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: isNowCompleted } : t))
    );

    if (isNowCompleted && user) {
      const awarded = await awardTaskRep(taskId, task.repReward || 50);
      if (awarded) {
        setRepAnimation({ amount: task.repReward || 50, id: Date.now() });
      }
    } else if (!isNowCompleted && user) {
      setUser((u) => (u ? { ...u, rep: Math.max(0, u.rep - task.repReward) } : null));
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
        completeOnboarding,
        repAnimation,
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
