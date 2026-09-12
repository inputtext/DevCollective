import React, { useEffect, useState } from 'react';
import { Loader2, MessageSquare, X } from 'lucide-react';
import { useClerk } from '@clerk/clerk-react';
import type { DuplicateQuestionMatchData } from './DuplicateQuestionMatch';
import type { CommunityComment } from '../types';

type Props = {
  match: DuplicateQuestionMatchData;
  onClose: () => void;
};

export const DuplicateQuestionDiscussion: React.FC<Props> = ({ match, onClose }) => {
  const { getToken } = useClerk();
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const baseUrl = String(import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
        if (!baseUrl) throw new Error('Supabase URL is not configured.');
        const token = await getToken();
        if (!token) throw new Error('Not authenticated.');
        const response = await fetch(
          `${baseUrl}/functions/v1/community-comments?postId=${encodeURIComponent(match.id)}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'Could not load the discussion.');
        if (!cancelled) setComments(Array.isArray(data.comments) ? data.comments : []);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'Could not load the discussion.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [getToken, match.id]);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-background/85 backdrop-blur-md">
      <div className="bg-surface border-2 border-outline-variant w-full max-w-2xl max-h-[88vh] overflow-hidden shadow-[7px_7px_0_#171717]">
        <div className="flex items-start justify-between gap-4 p-5 border-b-2 border-outline-variant bg-dc-yellow">
          <div className="min-w-0">
            <p className="font-label-mono text-[9px] uppercase tracking-[0.16em]">COMMUNITY / EXISTING QUESTION</p>
            <h2 className="dc-display text-3xl sm:text-4xl mt-2">FIND THE ANSWER.</h2>
          </div>
          <button type="button" onClick={onClose} className="p-2 border-2 border-outline-variant bg-surface hover:bg-dc-pink" aria-label="Close discussion">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(88vh-92px)] p-5 space-y-5">
          <article className="border-2 border-outline-variant bg-surface-container-low p-5">
            <div className="font-label-mono text-[9px] uppercase tracking-wider text-on-surface-variant">EXACT EXISTING QUESTION · {match.similarity}% MATCH</div>
            <h3 className="font-bold text-xl leading-tight mt-2">{match.title}</h3>
            <p className="text-sm leading-relaxed whitespace-pre-wrap mt-3">{match.content}</p>
            <p className="font-label-mono text-[9px] uppercase text-on-surface-variant mt-4">Posted {new Date(match.createdAt).toLocaleString()}</p>
          </article>

          <section>
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="w-4 h-4" />
              <h3 className="font-label-mono text-[10px] uppercase font-bold">DISCUSSION / {comments.length} COMMENTS</h3>
            </div>

            {loading ? (
              <div className="border-2 border-outline-variant p-8 flex items-center justify-center gap-2 text-sm text-on-surface-variant">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading discussion...
              </div>
            ) : error ? (
              <div className="border-2 border-error p-5 text-sm text-error">{error}</div>
            ) : comments.length === 0 ? (
              <div className="border-2 border-dashed border-outline-variant p-8 text-center text-sm text-on-surface-variant">
                No comments yet. You can return to Community and start the discussion.
              </div>
            ) : (
              <div className="space-y-3">
                {comments.map((comment) => (
                  <div key={comment.id} className="border-2 border-outline-variant/60 p-4 bg-surface-container-low">
                    <div className="flex items-center gap-3">
                      {comment.authorAvatar ? (
                        <img src={comment.authorAvatar} alt={comment.authorName} className="w-9 h-9 border border-outline-variant object-cover" />
                      ) : (
                        <div className="w-9 h-9 border border-outline-variant bg-dc-blue flex items-center justify-center text-xs font-bold">{comment.authorName.slice(0, 1)}</div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate">{comment.authorName}</p>
                        <p className="font-label-mono text-[9px] uppercase text-on-surface-variant">{comment.authorRole} · {comment.authorRep} REP · {new Date(comment.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap">{comment.content}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
