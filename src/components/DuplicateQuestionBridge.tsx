import React, { useEffect, useState } from 'react';
import { DuplicateQuestionMatch, type DuplicateQuestionMatchData } from './DuplicateQuestionMatch';

export const DuplicateQuestionBridge: React.FC = () => {
  const [match, setMatch] = useState<DuplicateQuestionMatchData | null>(null);

  useEffect(() => {
    const handleDuplicate = (event: Event) => {
      const detail = (event as CustomEvent<{ match?: DuplicateQuestionMatchData }>).detail;
      if (detail?.match) setMatch(detail.match);
    };
    window.addEventListener('devcollective:duplicate-question', handleDuplicate);
    return () => window.removeEventListener('devcollective:duplicate-question', handleDuplicate);
  }, []);

  if (!match) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
      <div className="w-full max-w-lg">
        <DuplicateQuestionMatch match={match} onDismiss={() => setMatch(null)} />
      </div>
    </div>
  );
};
