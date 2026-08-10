export type UserRole = 'student' | 'mentor' | 'faculty' | 'admin';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  college: string;
  branch: string;
  academicYear: string;
  avatar: string;
  bio: string;
  rep: number;
  level: number;
  streakDays: number;
  githubUrl?: string;
  linkedinUrl?: string;
  skills: string[];
  selectedDomains: string[];
  authProvider: 'email' | 'google' | 'github';
  createdAt: string;
}

export interface TaskItem {
  id: string;
  title: string;
  estimatedMinutes: number;
  repReward: number;
  completed: boolean;
}

export interface CommunityPost {
  id: string;
  authorId: string;
  authorName: string;
  authorCollege: string;
  authorAvatar: string;
  authorRole: string;
  authorRep: number;
  category: 'Build in Public' | 'Questions' | 'Projects' | 'Hackathons' | 'AI' | 'Android' | 'General';
  title?: string;
  content: string;
  imageUrl?: string;
  likes: number;
  commentsCount: number;
  createdAt: string;
  likedByMe?: boolean;
}

export interface Mentor {
  id: string;
  name: string;
  title: string;
  college: string;
  avatar: string;
  roleType: 'SENIOR' | 'FACULTY' | 'ALUMNI' | 'INDUSTRY';
  company?: string;
  skills: string[];
  level: number;
  rep: number;
  rating: number;
  studentsHelped: number;
  bio: string;
  availability: string;
  isBusy?: boolean;
}

export interface RoadmapLevel {
  levelNumber: number;
  title: string;
  description: string;
  status: 'completed' | 'current' | 'locked';
  repRequirement: number;
  topics: string[];
  capstoneProject: {
    title: string;
    description: string;
    unlocked: boolean;
  };
}

export interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  avatar: string;
  college: string;
  branch: string;
  rep: number;
  level: number;
  streakDays: number;
  isUser?: boolean;
}
