import React, { useEffect, useState } from 'react';
import { DuplicateQuestionDiscussion } from './DuplicateQuestionDiscussion';
import { DuplicateQuestionMatch, type DuplicateQuestionMatchData } from './DuplicateQuestionMatch';

export const DuplicateQuestionBridge: React.FC = () => {
  const [match, setMatch] = useState<DuplicateQuestionMatchData | null>(null);
  const [discussion, setDiscussion] = useState<DuplicateQuestionMatchData | null>(null);

  useEffect(() => {
    const handleDuplicate = (event: Event) => {
      const detail = (event as CustomEvent<{ match?: DuplicateQuestionMatchData }>).detail;
      if (detail?.match) {
        setDiscussion(null);
        setMatch(detail.match);
      }
    };

    const handleOpenCommunityPost = (event: Event) => {
      const detail = (event as CustomEvent<{ postId?: string; match?: DuplicateQuestionMatchData }>).detail;
      if (!detail?.postId) return;
      if (detail.match) {
        setMatch(null);
        setDiscussion(detail.match);
      }
    };

    window.addEventListener('devcollective:duplicate-question', handleDuplicate);
    window.addEventListener('devcollective:open-community-post', handleOpenCommunityPost);
    return () => {
      window.removeEventListener('devcollective:duplicate-question', handleDuplicate);
      window.removeEventListener('devcollective:open-community-post', handleOpenCommunityPost);
    };
  }, []);

  if (discussion) {
    return <DuplicateQuestionDiscussion match={discussion} onClose={() => setDiscussion(null)} />;
  }

  if (!match) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
      <div className="w-full max-w-lg">
        <DuplicateQuestionMatch match={match} onDismiss={() => setMatch(null)} />
      </div>
    </div>
  );
};
