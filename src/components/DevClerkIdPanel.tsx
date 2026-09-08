import React, { useState } from 'react';
import { Copy, Check, UserRound } from 'lucide-react';
import { useAuth } from '@clerk/react';

/**
 * Development-only helper for the initial WebSocket messaging beta.
 * It is hidden from production builds so the temporary Clerk-ID workflow
 * does not become part of the public product UX.
 */
export const DevClerkIdPanel: React.FC = () => {
  const { userId, isLoaded, isSignedIn } = useAuth();
  const [copied, setCopied] = useState(false);

  if (!import.meta.env.DEV || !isLoaded || !isSignedIn || !userId) return null;

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(userId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="fixed left-4 bottom-4 z-[55] w-[min(360px,calc(100vw-2rem))] border-2 border-outline-variant bg-surface shadow-[5px_5px_0_#171717]">
      <div className="flex items-center justify-between gap-3 border-b-2 border-outline-variant bg-dc-yellow px-3 py-2">
        <div className="flex items-center gap-2">
          <UserRound className="h-4 w-4" />
          <span className="font-label-mono text-[10px] font-bold uppercase tracking-[0.12em]">DEV / CLERK ID</span>
        </div>
        <span className="font-label-mono text-[9px] uppercase">Messaging test</span>
      </div>
      <div className="p-3">
        <p className="mb-2 font-label-mono text-[9px] uppercase text-on-surface-variant">Your Clerk user ID</p>
        <div className="flex items-stretch gap-2">
          <code className="min-w-0 flex-1 overflow-x-auto border-2 border-outline-variant bg-surface-container-low px-2 py-2 font-label-mono text-[10px] whitespace-nowrap">
            {userId}
          </code>
          <button
            type="button"
            onClick={copyId}
            className="shrink-0 border-2 border-outline-variant bg-dc-blue px-3 font-label-mono text-[10px] font-bold uppercase shadow-[2px_2px_0_#171717] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
            title="Copy Clerk user ID"
            aria-label="Copy Clerk user ID"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
        <p className="mt-2 font-label-mono text-[9px] text-on-surface-variant">Development helper only · hidden from production builds.</p>
      </div>
    </div>
  );
};
