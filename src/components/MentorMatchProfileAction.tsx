import React from 'react';
import { UserRound } from 'lucide-react';
import { useSocial } from '../context/SocialContext';

export const MentorMatchProfileAction: React.FC<{ mentorId: string }> = ({ mentorId }) => {
  const { openProfile } = useSocial();
  return <button type="button" onClick={() => openProfile(mentorId)} aria-label="View mentor profile" className="inline-flex items-center gap-2 border-2 border-outline-variant bg-dc-lavender px-3 py-2 font-label-mono text-[9px] uppercase font-bold shadow-[3px_3px_0_#171717] hover:-translate-y-0.5 transition-transform"><UserRound className="w-3.5 h-3.5" /> View profile</button>;
};
