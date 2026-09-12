import React from 'react';
import { ExternalLink, X } from 'lucide-react';

export type DuplicateQuestionMatchData = {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: string;
  similarity: number;
};

type Props = {
  match: DuplicateQuestionMatchData;
  onDismiss?: () => void;
};

export const DuplicateQuestionMatch: React.FC<Props> = ({ match, onDismiss }) => {
  const openExistingQuestion = () => {
    window.dispatchEvent(new CustomEvent('devcollective:open-community-post', { detail: { postId: match.id } }));
    window.history.replaceState({}, '', `${window.location.pathname}?post=${encodeURIComponent(match.id)}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
    onDismiss?.();
  };

  return (
    <div className="mt-3 border-2 border-outline-variant bg-surface dc-hard-shadow-sm overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b-2 border-outline-variant bg-dc-yellow">
        <div>
          <div className="font-label-mono text-[9px] uppercase tracking-wider">EXISTING MATCH</div>
          <div className="font-bold text-sm">{match.similarity}% semantic match</div>
        </div>
        {onDismiss && <button type="button" onClick={onDismiss} aria-label="Dismiss duplicate match" className="p-1 hover:bg-surface/60"><X size={16} /></button>}
      </div>
      <div className="p-4 space-y-3">
        <div className="font-label-mono text-[9px] uppercase tracking-wider text-on-surface-variant">COMMUNITY QUESTION</div>
        <h3 className="font-bold text-base leading-tight">{match.title}</h3>
        <p className="text-sm leading-relaxed text-on-surface-variant whitespace-pre-wrap line-clamp-5">{match.content}</p>
        <button type="button" onClick={openExistingQuestion} className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-primary text-on-primary font-bold text-xs border-2 border-outline-variant dc-hard-shadow-sm">
          <ExternalLink size={15} /> VIEW QUESTION & FIND ANSWER
        </button>
      </div>
    </div>
  );
};
