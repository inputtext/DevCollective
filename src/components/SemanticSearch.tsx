import React, { forwardRef, useEffect, useRef, useState } from 'react';
import { Loader2, Search, Command } from 'lucide-react';

type SemanticSearchResult = {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: string;
  similarity: number;
};

type SemanticSearchProps = {
  onOpenCommunity: () => void;
};

export const SemanticSearch = forwardRef<HTMLInputElement, SemanticSearchProps>(({ onOpenCommunity }, forwardedRef) => {
  const containerRef = useRef<HTMLLabelElement>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SemanticSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/search/semantic?q=${encodeURIComponent(trimmed)}`);
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'Semantic search failed.');
        if (!cancelled) setResults(Array.isArray(data.results) ? data.results : []);
      } catch (error) {
        if (!cancelled) setResults([]);
        console.warn('Semantic search unavailable:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleResultClick = () => {
    setOpen(false);
    setQuery('');
    setResults([]);
    onOpenCommunity();
  };

  return (
    <label ref={containerRef} className="relative flex items-center gap-3 w-full max-w-xl border-2 border-outline-variant bg-surface px-3.5 py-2.5 transition-colors focus-within:border-primary focus-within:shadow-[3px_3px_0_var(--outline-variant)]">
      <Search className="w-4 h-4 text-on-surface-variant shrink-0" />
      <input
        ref={forwardedRef}
        type="text"
        value={query}
        onChange={(event) => { setQuery(event.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={(event) => { if (event.key === 'Enter' && results[0]) handleResultClick(); }}
        placeholder="Search projects, mentors, roadmaps..."
        className="bg-transparent border-none outline-none text-xs sm:text-sm w-full text-on-surface placeholder:text-on-surface-variant"
        aria-label="Search DevCollective"
        aria-expanded={open && query.trim().length >= 2}
        aria-controls="semantic-search-results"
      />
      <span className="hidden sm:flex items-center gap-1 px-1.5 py-1 border border-outline-variant/60 text-[8px] dc-mono text-on-surface-variant shrink-0"><Command className="w-2.5 h-2.5" />K</span>
      {open && query.trim().length >= 2 && (
        <div id="semantic-search-results" role="listbox" className="absolute left-0 right-0 top-full mt-2 bg-surface border-2 border-outline-variant shadow-[7px_7px_0_#171717] z-[60] overflow-hidden">
          <div className="px-4 py-2.5 border-b-2 border-outline-variant bg-background flex items-center justify-between gap-3">
            <span className="dc-mono text-[9px] uppercase font-bold text-primary">Semantic community search</span>
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />}
          </div>
          {loading && results.length === 0 ? (
            <div className="px-4 py-5 text-center"><p className="dc-mono text-[9px] uppercase text-on-surface-variant">Searching community...</p></div>
          ) : results.length === 0 ? (
            <div className="px-4 py-5 text-center"><p className="dc-mono text-[9px] uppercase font-bold">No related posts found</p><p className="text-[10px] text-on-surface-variant mt-1">Try a different description or question.</p></div>
          ) : (
            <div className="max-h-[360px] overflow-y-auto">
              {results.slice(0, 6).map((result) => (
                <button key={result.id} type="button" role="option" onClick={handleResultClick} className="w-full text-left px-4 py-3.5 border-b border-outline-variant/40 hover:bg-dc-blue/20 transition-colors">
                  <div className="flex items-start justify-between gap-3"><p className="text-xs font-bold truncate">{result.title || 'Community discussion'}</p><span className="dc-mono text-[8px] text-primary shrink-0">{Math.round(result.similarity * 100)}%</span></div>
                  <p className="text-[10px] text-on-surface-variant mt-1.5 line-clamp-2">{result.content}</p>
                  <p className="dc-mono text-[8px] uppercase text-on-surface-variant mt-2">{result.category || 'Community'} · Open in Community</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </label>
  );
});

SemanticSearch.displayName = 'SemanticSearch';
