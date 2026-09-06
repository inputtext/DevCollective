import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useAuth as useClerkAuth } from '@clerk/react';
import { UserProfile } from '../types';

export interface SocialSummary {
  followerCount: number;
  followingCount: number;
  connectionCount: number;
  isFollowing: boolean;
  connectionStatus: 'none' | 'outgoing_pending' | 'incoming_pending' | 'connected';
  connectionRequestId: string | null;
  followers: Pick<UserProfile, 'id' | 'name' | 'avatar' | 'role' | 'college'>[];
  connections: Pick<UserProfile, 'id' | 'name' | 'avatar' | 'role' | 'college'>[];
}

interface SocialContextValue {
  viewedProfileId: string | null;
  openProfile: (userId: string) => void;
  closeProfile: () => void;
  loadSocialSummary: (userId: string) => Promise<SocialSummary>;
  toggleFollow: (userId: string) => Promise<SocialSummary>;
  requestConnection: (userId: string) => Promise<SocialSummary>;
  respondToConnection: (requestId: string, action: 'accept' | 'reject') => Promise<SocialSummary | null>;
}

const SocialContext = createContext<SocialContextValue | null>(null);

export const SocialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { getToken } = useClerkAuth();
  const [viewedProfileId, setViewedProfileId] = useState<string | null>(null);

  const socialFetch = useCallback(async (path: string, init: RequestInit = {}) => {
    const baseUrl = String(import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
    if (!baseUrl) throw new Error('Supabase URL is not configured.');
    const token = await getToken();
    if (!token) throw new Error('Not authenticated.');
    const headers = new Headers(init.headers);
    headers.set('Authorization', `Bearer ${token}`);
    headers.set('Content-Type', 'application/json');
    const response = await fetch(`${baseUrl}/functions/v1/social-graph${path}`, { ...init, headers });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Social request failed.');
    return data;
  }, [getToken]);

  const loadSocialSummary = useCallback(async (userId: string) => {
    const data = await socialFetch(`?action=summary&userId=${encodeURIComponent(userId)}`);
    return data.summary as SocialSummary;
  }, [socialFetch]);

  const toggleFollow = useCallback(async (userId: string) => {
    const data = await socialFetch('?action=toggle-follow', { method: 'POST', body: JSON.stringify({ userId }) });
    return data.summary as SocialSummary;
  }, [socialFetch]);

  const requestConnection = useCallback(async (userId: string) => {
    const data = await socialFetch('?action=request-connection', { method: 'POST', body: JSON.stringify({ userId }) });
    return data.summary as SocialSummary;
  }, [socialFetch]);

  const respondToConnection = useCallback(async (requestId: string, action: 'accept' | 'reject') => {
    const data = await socialFetch('?action=respond-connection', { method: 'POST', body: JSON.stringify({ requestId, action }) });
    return data.summary ? data.summary as SocialSummary : null;
  }, [socialFetch]);

  const value = useMemo(() => ({
    viewedProfileId,
    openProfile: (userId: string) => setViewedProfileId(userId),
    closeProfile: () => setViewedProfileId(null),
    loadSocialSummary,
    toggleFollow,
    requestConnection,
    respondToConnection,
  }), [viewedProfileId, loadSocialSummary, toggleFollow, requestConnection, respondToConnection]);

  return <SocialContext.Provider value={value}>{children}</SocialContext.Provider>;
};

export const useSocial = () => {
  const context = useContext(SocialContext);
  if (!context) throw new Error('useSocial must be used inside SocialProvider.');
  return context;
};
