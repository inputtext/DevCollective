import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Sparkles } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

const WELCOME_MESSAGE: ChatMessage = {
  role: 'model',
  text: "Hey! I'm the DevCollective assistant. Ask me anything about the platform, your roadmap, mentors, REP points, or how to get around.",
};

function renderFormattedText(text: string): React.ReactNode {
  const renderInline = (line: string, keyPrefix: string): React.ReactNode[] => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        return <strong key={`${keyPrefix}-${i}`} className="font-bold text-white">{part.slice(2, -2)}</strong>;
      }
      return <React.Fragment key={`${keyPrefix}-${i}`}>{part}</React.Fragment>;
    });
  };

  const lines = text.split('\n');
  return lines.map((line, i) => {
    const trimmed = line.trim();
    const bulletMatch = trimmed.match(/^[*-]\s+(.*)$/);
    if (bulletMatch) {
      return <div key={i} className="flex gap-2 pl-0.5"><span className="text-primary shrink-0">•</span><span>{renderInline(bulletMatch[1], `l${i}`)}</span></div>;
    }
    if (trimmed === '') return <div key={i} className="h-1.5" />;
    return <div key={i}>{renderInline(line, `l${i}`)}</div>;
  });
}

export const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isOpen, isSending]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isSending) return;

    const nextMessages: ChatMessage[] = [...messages, { role: 'user', text: trimmed }];
    setMessages(nextMessages);
    setInput('');
    setError(null);
    setIsSending(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, history: nextMessages.slice(0, -1) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong.');
      setMessages((prev) => [...prev, { role: 'model', text: data.reply }]);
    } catch (err: any) {
      setError(err.message || 'Could not reach the assistant. Try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-20 right-6 z-[90] w-14 h-14 rounded-full bg-primary-container text-white shadow-2xl flex items-center justify-center hover:brightness-110 active:scale-95 transition-all"
        title="Ask DevCollective Assistant"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {isOpen && (
        <div className="fixed bottom-36 right-6 z-[90] w-[calc(100vw-3rem)] max-w-sm h-[28rem] bg-surface-container border-2 border-outline-variant rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in">
          <div className="flex items-center gap-2.5 px-4 py-3.5 border-b-2 border-outline-variant bg-surface-container-low shrink-0">
            <div className="w-8 h-8 bg-primary-container rounded-lg flex items-center justify-center text-white shrink-0"><Sparkles className="w-4 h-4" /></div>
            <div className="min-w-0"><p className="font-label-mono text-xs uppercase font-bold text-white">DevCollective Assistant</p><p className="text-[10px] text-on-surface-variant">Ask about the platform</p></div>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.map((m, i) => <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed space-y-0.5 ${m.role === 'user' ? 'bg-primary-container text-white rounded-br-sm' : 'bg-surface-container-low border border-outline-variant/50 text-on-surface rounded-bl-sm'}`}>{renderFormattedText(m.text)}</div></div>)}
            {isSending && <div className="flex justify-start"><div className="bg-surface-container-low border border-outline-variant/50 px-3.5 py-2.5 rounded-2xl rounded-bl-sm flex items-center gap-2"><Loader2 className="w-3.5 h-3.5 animate-spin text-primary" /><span className="text-xs text-on-surface-variant">Thinking...</span></div></div>}
            {error && <div className="flex justify-start"><div className="bg-error/10 border border-error/30 text-error px-3.5 py-2.5 rounded-2xl text-xs">{error}</div></div>}
          </div>
          <form onSubmit={handleSend} className="flex items-center gap-2 p-3 border-t-2 border-outline-variant bg-surface-container-low shrink-0">
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about DevCollective..." className="flex-1 bg-surface-container-lowest border-2 border-outline-variant rounded-full px-4 py-2.5 text-sm text-white placeholder:text-outline focus:border-primary outline-none transition-all" />
            <button type="submit" disabled={isSending || !input.trim()} className="w-10 h-10 shrink-0 bg-primary-container text-white rounded-full flex items-center justify-center hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"><Send className="w-4 h-4" /></button>
          </form>
        </div>
      )}
    </>
  );
};
