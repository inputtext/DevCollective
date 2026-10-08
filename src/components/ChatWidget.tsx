import React, { useState } from 'react';
import { MessageCircle, X, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AiChatPanel } from './AiChatPanel';

const WELCOME = "Hey! I'm the DevCollective assistant. Ask me anything about the platform, your roadmap, mentors, REP points, or how to get around. You can also send me a screenshot if you are stuck.";

export const ChatWidget: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const buildContext = () => ({ profile: user ? { name: user.name, branch: user.branch, academicYear: user.academicYear, skills: (user as any).skills, rep: user.rep, level: (user as any).level } : undefined });

  return (
    <>
      <button onClick={() => setIsOpen((p) => !p)} className="fixed bottom-20 right-6 z-[90] w-14 h-14 rounded-full bg-primary-container text-on-primary border-2 border-outline-variant shadow-2xl flex items-center justify-center hover:brightness-95 active:scale-95 transition-all" title="Ask DevCollective Assistant" aria-label="Open assistant">
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>
      {/* Kept mounted (just hidden) so the conversation never resets when the window is closed */}
      <div className={`${isOpen ? 'flex' : 'hidden'} fixed bottom-36 right-6 z-[90] w-[calc(100vw-3rem)] max-w-sm h-[32rem] max-h-[70vh] bg-surface-container border-2 border-outline-variant rounded-2xl shadow-2xl flex-col overflow-hidden`}>
        <div className="flex items-center gap-2.5 px-4 py-3.5 border-b-2 border-outline-variant bg-surface-container-low shrink-0">
          <div className="w-8 h-8 bg-primary-container text-on-primary border border-outline-variant rounded-lg flex items-center justify-center shrink-0"><Sparkles className="w-4 h-4" /></div>
          <div className="min-w-0"><p className="font-label-mono text-xs uppercase font-bold text-on-surface">DevCollective Assistant</p><p className="text-[10px] text-on-surface-variant">Ask about the platform. Photos and voice work too.</p></div>
        </div>
        <AiChatPanel storageKey={user ? `devcollective_assistant_chat_${user.id}` : null} welcome={WELCOME} endpoint="/api/chat" buildContext={buildContext} placeholder="Ask about DevCollective..." />
      </div>
    </>
  );
};
