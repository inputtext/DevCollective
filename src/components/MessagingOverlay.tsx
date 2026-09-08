import React, { useEffect, useMemo, useState } from 'react';
import { MessageCircle, X, Send, Wifi, WifiOff, UserRound, Loader2 } from 'lucide-react';
import { useUser } from '@clerk/react';
import { useDevCollectiveWebSocket } from '../hooks/useDevCollectiveWebSocket';

type Conversation = {
  id: string;
  participant: { id: string; name: string; avatar?: string; role?: string; level?: number; rep?: number } | null;
  lastMessageAt: string | null;
};

type Message = {
  id: string;
  conversation_id: string;
  sender_clerk_user_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
};

export const MessagingOverlay: React.FC = () => {
  const { isSignedIn, user: clerkUser } = useUser();
  const { connected, send, subscribe } = useDevCollectiveWebSocket();
  const [open, setOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [recipientId, setRecipientId] = useState('');
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);

  useEffect(() => subscribe((event) => {
    if (event.type === 'conversation:list') setConversations((event.conversations as Conversation[]) || []);
    if (event.type === 'conversation:list:invalidate') send({ type: 'conversation:list' });
    if (event.type === 'conversation:started') {
      const id = String(event.conversationId || '');
      if (id) setActiveConversation(id);
    }
    if (event.type === 'conversation:history' && String(event.conversationId) === activeConversation) {
      setMessages((event.messages as Message[]) || []);
      setLoading(false);
    }
    if (event.type === 'message:new') {
      const message = event.message as Message;
      if (message?.conversation_id === activeConversation) {
        setMessages((current) => current.some((item) => item.id === message.id) ? current : [...current, message]);
        if (message.sender_clerk_user_id !== clerkUser?.id) send({ type: 'message:read', conversationId: message.conversation_id, messageId: message.id });
      }
      send({ type: 'conversation:list' });
    }
    if (event.type === 'typing:start' && String(event.conversationId) === activeConversation && event.userId !== clerkUser?.id) setTyping(true);
    if (event.type === 'typing:stop' && String(event.conversationId) === activeConversation) setTyping(false);
  }), [activeConversation, clerkUser?.id, send]);

  useEffect(() => {
    if (open && connected) send({ type: 'conversation:list' });
  }, [open, connected, send]);

  useEffect(() => {
    if (!activeConversation || !connected) return;
    setLoading(true);
    send({ type: 'conversation:open', conversationId: activeConversation });
  }, [activeConversation, connected, send]);

  const active = useMemo(() => conversations.find((item) => item.id === activeConversation) || null, [activeConversation, conversations]);

  if (!isSignedIn) return null;

  const startConversation = () => {
    const id = recipientId.trim();
    if (!id || id === clerkUser?.id || !connected) return;
    send({ type: 'conversation:start', recipientId: id });
    setRecipientId('');
  };

  const sendMessage = () => {
    const body = draft.trim();
    if (!body || !activeConversation || !connected) return;
    send({ type: 'message:send', conversationId: activeConversation, body });
    setDraft('');
    send({ type: 'typing:stop', conversationId: activeConversation });
  };

  const handleDraftChange = (value: string) => {
    setDraft(value);
    if (!activeConversation || !connected) return;
    send({ type: value ? 'typing:start' : 'typing:stop', conversationId: activeConversation });
  };

  return <>
    <button onClick={() => setOpen((value) => !value)} className="fixed bottom-5 right-5 z-[60] flex items-center gap-2 bg-primary text-on-primary border-2 border-outline-variant px-4 py-3 font-label-mono text-[10px] uppercase font-bold shadow-[5px_5px_0_#171717] hover:-translate-y-0.5 transition-transform" aria-label="Open messages">
      <MessageCircle className="w-5 h-5" /> Messages
      <span className={`w-2.5 h-2.5 rounded-full border border-outline-variant ${connected ? 'bg-dc-mint' : 'bg-dc-pink'}`} />
    </button>

    {open && <section className="fixed bottom-20 right-5 z-[59] w-[min(900px,calc(100vw-24px))] h-[min(650px,calc(100vh-110px))] bg-background border-2 border-outline-variant shadow-[8px_8px_0_#171717] flex overflow-hidden">
      <aside className="w-[280px] shrink-0 border-r-2 border-outline-variant bg-surface flex flex-col">
        <div className="p-4 border-b-2 border-outline-variant flex items-center justify-between"><div><p className="font-label-mono text-[10px] uppercase font-bold text-primary">Direct Messages</p><p className="text-[10px] text-on-surface-variant mt-1">Beta · all authenticated users</p></div><button onClick={() => setOpen(false)} className="p-1.5 border-2 border-transparent hover:border-outline-variant"><X className="w-4 h-4" /></button></div>
        <div className="p-3 border-b border-outline-variant/50 space-y-2"><input value={recipientId} onChange={(event) => setRecipientId(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') startConversation(); }} placeholder="Recipient Clerk user ID" className="w-full bg-background border-2 border-outline-variant px-3 py-2 text-[10px] outline-none focus:border-primary" /><button onClick={startConversation} disabled={!recipientId.trim() || !connected} className="w-full px-3 py-2 bg-dc-mint border-2 border-outline-variant font-label-mono text-[9px] uppercase font-bold disabled:opacity-40">Start conversation</button></div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? <div className="p-6 text-center text-on-surface-variant"><UserRound className="w-7 h-7 mx-auto mb-2" /><p className="font-label-mono text-[9px] uppercase">No conversations yet</p></div> : conversations.map((conversation) => <button key={conversation.id} onClick={() => setActiveConversation(conversation.id)} className={`w-full p-3 text-left flex gap-3 border-b border-outline-variant/40 hover:bg-dc-blue/20 ${conversation.id === activeConversation ? 'bg-dc-blue/20 border-l-4 border-l-primary' : ''}`}>
            {conversation.participant?.avatar ? <img src={conversation.participant.avatar} alt="" className="w-9 h-9 object-cover border-2 border-outline-variant" /> : <div className="w-9 h-9 bg-dc-yellow border-2 border-outline-variant flex items-center justify-center font-bold">{conversation.participant?.name?.slice(0, 1) || '?'}</div>}
            <div className="min-w-0"><p className="text-xs font-bold truncate">{conversation.participant?.name || 'Unknown developer'}</p><p className="font-label-mono text-[8px] uppercase text-on-surface-variant mt-1">{conversation.participant?.role || 'member'} · L{conversation.participant?.level || '?'}</p></div>
          </button>)}
        </div>
      </aside>

      <main className="flex-1 min-w-0 flex flex-col bg-background">
        <header className="h-16 shrink-0 border-b-2 border-outline-variant px-4 flex items-center justify-between">
          {active ? <div className="flex items-center gap-3"><div className="w-9 h-9 bg-dc-lavender border-2 border-outline-variant flex items-center justify-center font-bold">{active.participant?.name?.slice(0, 1) || '?'}</div><div><p className="font-bold text-sm">{active.participant?.name || 'Developer'}</p><p className="font-label-mono text-[8px] uppercase text-on-surface-variant">{active.participant?.role || 'member'}</p></div></div> : <p className="font-label-mono text-[10px] uppercase text-on-surface-variant">Select a conversation</p>}
          <div className="flex items-center gap-2 font-label-mono text-[8px] uppercase">{connected ? <><Wifi className="w-3.5 h-3.5 text-primary" /> Connected</> : <><WifiOff className="w-3.5 h-3.5" /> Offline</>}</div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {!activeConversation ? <div className="h-full flex items-center justify-center text-center text-on-surface-variant"><div><MessageCircle className="w-10 h-10 mx-auto mb-3" /><p className="font-label-mono text-[10px] uppercase font-bold">Start a conversation</p><p className="text-xs mt-2 max-w-sm">Enter another authenticated user's Clerk ID to start the beta messaging flow.</p></div></div> : loading ? <div className="h-full flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div> : <>{messages.map((message) => { const mine = message.sender_clerk_user_id === clerkUser?.id; return <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[75%] px-3 py-2 border-2 border-outline-variant ${mine ? 'bg-dc-blue' : 'bg-surface'}`}><p className="text-sm whitespace-pre-wrap break-words">{message.body}</p><p className="font-label-mono text-[7px] uppercase text-on-surface-variant mt-1">{new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p></div></div>; })}{typing && <p className="font-label-mono text-[8px] uppercase text-on-surface-variant">Typing…</p>}</>}
        </div>
        {activeConversation && <form onSubmit={(event) => { event.preventDefault(); sendMessage(); }} className="p-3 border-t-2 border-outline-variant flex gap-2"><input value={draft} onChange={(event) => handleDraftChange(event.target.value)} placeholder={connected ? 'Write a message…' : 'Connecting…'} disabled={!connected} className="flex-1 bg-surface border-2 border-outline-variant px-3 py-3 text-sm outline-none focus:border-primary disabled:opacity-50" /><button type="submit" disabled={!draft.trim() || !connected} className="px-4 bg-primary text-on-primary border-2 border-outline-variant font-bold disabled:opacity-40"><Send className="w-4 h-4" /></button></form>}
      </main>
    </section>}
  </>;
};
