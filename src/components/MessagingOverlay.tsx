import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Loader2, MessageCircle, Plus, Search, Send, UserRound, Wifi, WifiOff, X } from 'lucide-react';
import { useAuth, useUser } from '@clerk/react';
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

type DirectoryMember = {
  id: string;
  name: string;
  role: string;
  college: string;
  branch: string;
  avatar: string;
  level: number;
  rep: number;
  skills: string[];
};

const OPEN_MESSAGE_EVENT = 'devcollective:open-message';
type OpenMessageDetail = { userId: string };

export const openMessagingForUser = (userId: string) => {
  const id = userId.trim();
  if (!id) return;
  window.dispatchEvent(new CustomEvent<OpenMessageDetail>(OPEN_MESSAGE_EVENT, { detail: { userId: id } }));
};

const displayRole = (role: string) => role.replace(/[_-]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

export const MessagingOverlay: React.FC = () => {
  const { isSignedIn, user: clerkUser } = useUser();
  const { getToken } = useAuth();
  const { connected, send, subscribe } = useDevCollectiveWebSocket();
  const [open, setOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [activeParticipant, setActiveParticipant] = useState<DirectoryMember | Conversation['participant']>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [recipientId, setRecipientId] = useState('');
  const [pendingRecipientId, setPendingRecipientId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [members, setMembers] = useState<DirectoryMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState('');
  const [startingRecipient, setStartingRecipient] = useState<string | null>(null);
  const [messagingError, setMessagingError] = useState('');

  useEffect(() => subscribe((event) => {
    if (event.type === 'conversation:list') setConversations((event.conversations as Conversation[]) || []);
    if (event.type === 'conversation:list:invalidate') send({ type: 'conversation:list' });
    if (event.type === 'conversation:started') {
      const id = String(event.conversationId || '');
      if (id) {
        setActiveConversation(id);
        setStartingRecipient(null);
        setMessagingError('');
        if (Array.isArray(event.messages)) setMessages((event.messages as Message[]) || []);
      }
    }
    if (event.type === 'conversation:history' && String(event.conversationId) === activeConversation) {
      setMessages((event.messages as Message[]) || []);
      setLoading(false);
      setMessagingError('');
    }
    if (event.type === 'message:new') {
      const message = event.message as Message;
      if (message?.conversation_id === activeConversation) {
        setMessages((current) => current.some((item) => item.id === message.id) ? current : [...current, message]);
        if (message.sender_clerk_user_id !== clerkUser?.id) send({ type: 'message:read', conversationId: message.conversation_id, messageId: message.id });
      }
      send({ type: 'conversation:list' });
    }
    if (event.type === 'message:read' && String(event.conversationId) === activeConversation) {
      setMessages((current) => current.map((message) => message.id === event.messageId ? { ...message, read_at: new Date().toISOString() } : message));
    }
    if (event.type === 'typing:start' && String(event.conversationId) === activeConversation && event.userId !== clerkUser?.id) setTyping(true);
    if (event.type === 'typing:stop' && String(event.conversationId) === activeConversation) setTyping(false);
    if (event.type === 'error') {
      setStartingRecipient(null);
      setLoading(false);
      setMessagingError(String(event.message || 'Messaging request failed.'));
    }
  }), [activeConversation, clerkUser?.id, send]);

  useEffect(() => {
    const handleOpenMessage = (event: Event) => {
      const detail = (event as CustomEvent<OpenMessageDetail>).detail;
      const id = detail?.userId?.trim();
      if (!id || id === clerkUser?.id) return;
      setOpen(true);
      setPickerOpen(false);
      setRecipientId(id);
      setPendingRecipientId(id);
      setStartingRecipient(id);
      setMessagingError('');
    };
    window.addEventListener(OPEN_MESSAGE_EVENT, handleOpenMessage);
    return () => window.removeEventListener(OPEN_MESSAGE_EVENT, handleOpenMessage);
  }, [clerkUser?.id]);

  useEffect(() => {
    if (!pendingRecipientId || !connected) return;
    if (pendingRecipientId === clerkUser?.id) {
      setPendingRecipientId(null);
      setStartingRecipient(null);
      return;
    }
    send({ type: 'conversation:start', recipientId: pendingRecipientId });
    setPendingRecipientId(null);
  }, [pendingRecipientId, connected, clerkUser?.id, send]);

  useEffect(() => {
    if (open && connected) send({ type: 'conversation:list' });
  }, [open, connected, send]);

  useEffect(() => {
    if (!activeConversation || !connected) return;
    setLoading(true);
    send({ type: 'conversation:open', conversationId: activeConversation });
  }, [activeConversation, connected, send]);

  useEffect(() => {
    if (!pickerOpen) return;
    let cancelled = false;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setMembersLoading(true);
      setMembersError('');
      try {
        const token = await getToken();
        if (!token) throw new Error('Not authenticated.');
        const query = memberSearch.trim();
        const response = await fetch(`/api/users/directory?limit=50${query ? `&q=${encodeURIComponent(query)}` : ''}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'Could not load members.');
        if (!cancelled) setMembers(Array.isArray(data.members) ? data.members as DirectoryMember[] : []);
      } catch (error: any) {
        if (!cancelled && error?.name !== 'AbortError') setMembersError(error?.message || 'Could not load members.');
      } finally {
        if (!cancelled) setMembersLoading(false);
      }
    }, memberSearch ? 220 : 0);
    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [pickerOpen, memberSearch, getToken]);

  const active = useMemo(() => conversations.find((item) => item.id === activeConversation) || null, [activeConversation, conversations]);
  const activePerson = active?.participant || activeParticipant;

  if (!isSignedIn) return null;

  const openNewMessage = () => {
    setPickerOpen(true);
    setMemberSearch('');
    setMembersError('');
    setMessagingError('');
  };

  const selectMember = (member: DirectoryMember) => {
    if (!connected || member.id === clerkUser?.id) return;
    setOpen(true);
    setPickerOpen(false);
    setRecipientId(member.id);
    setActiveParticipant(member);
    setStartingRecipient(member.id);
    setMessagingError('');
    setActiveConversation(null);
    setMessages([]);
    setPendingRecipientId(member.id);
  };

  const startConversation = () => {
    const id = recipientId.trim();
    if (!id || id === clerkUser?.id || !connected) return;
    setStartingRecipient(id);
    setMessagingError('');
    send({ type: 'conversation:start', recipientId: id });
    setRecipientId('');
  };

  const selectConversation = (conversation: Conversation) => {
    setActiveConversation(conversation.id);
    setActiveParticipant(conversation.participant);
    setMessages([]);
    setTyping(false);
    setMessagingError('');
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
      <aside className="w-[310px] max-w-[42%] shrink-0 border-r-2 border-outline-variant bg-surface flex flex-col">
        <div className="p-4 border-b-2 border-outline-variant flex items-center justify-between">
          <div><p className="font-label-mono text-[10px] uppercase font-bold text-primary">Direct Messages</p><p className="text-[10px] text-on-surface-variant mt-1">Beta · all authenticated users</p></div>
          <button onClick={() => setOpen(false)} className="p-1.5 border-2 border-transparent hover:border-outline-variant" aria-label="Close messages"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-3 border-b border-outline-variant/50">
          <button onClick={openNewMessage} className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-dc-yellow border-2 border-outline-variant shadow-[2px_2px_0_#171717] font-label-mono text-[9px] uppercase font-bold hover:-translate-y-0.5 transition-transform">
            <Plus className="w-4 h-4" /> New message
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? <div className="p-6 text-center text-on-surface-variant"><UserRound className="w-7 h-7 mx-auto mb-2" /><p className="font-label-mono text-[9px] uppercase">No conversations yet</p><p className="text-[10px] mt-2 leading-relaxed">Start a new message to find any member of DevCollective.</p></div> : conversations.map((conversation) => <button key={conversation.id} onClick={() => selectConversation(conversation)} className={`w-full p-3 text-left flex gap-3 border-b border-outline-variant/40 hover:bg-dc-blue/20 ${conversation.id === activeConversation ? 'bg-dc-blue/20 border-l-4 border-l-primary' : ''}`}>
            {conversation.participant?.avatar ? <img src={conversation.participant.avatar} alt="" className="w-9 h-9 object-cover border-2 border-outline-variant" /> : <div className="w-9 h-9 bg-dc-yellow border-2 border-outline-variant flex items-center justify-center font-bold">{conversation.participant?.name?.slice(0, 1) || '?'}</div>}
            <div className="min-w-0"><p className="text-xs font-bold truncate">{conversation.participant?.name || 'Unknown developer'}</p><p className="font-label-mono text-[8px] uppercase text-on-surface-variant mt-1">{displayRole(conversation.participant?.role || 'member')} · L{conversation.participant?.level || '?'}</p></div>
          </button>)}
        </div>

        <div className="p-3 border-t border-outline-variant/50">
          <details>
            <summary className="cursor-pointer font-label-mono text-[8px] uppercase text-on-surface-variant">Developer testing</summary>
            <div className="mt-2 space-y-2"><input value={recipientId} onChange={(event) => { setRecipientId(event.target.value); setPendingRecipientId(null); }} onKeyDown={(event) => { if (event.key === 'Enter') startConversation(); }} placeholder="Clerk user ID" className="w-full bg-background border-2 border-outline-variant px-3 py-2 text-[9px] outline-none focus:border-primary" /><button onClick={startConversation} disabled={!recipientId.trim() || !connected || Boolean(startingRecipient)} className="w-full px-3 py-2 bg-background border-2 border-outline-variant font-label-mono text-[8px] uppercase font-bold disabled:opacity-40">{startingRecipient ? 'Starting…' : 'Start by ID'}</button></div>
          </details>
        </div>
      </aside>

      <main className="flex-1 min-w-0 flex flex-col bg-background">
        <header className="h-16 shrink-0 border-b-2 border-outline-variant px-4 flex items-center justify-between">
          {activePerson ? <div className="flex items-center gap-3 min-w-0"><div className="w-9 h-9 shrink-0 bg-dc-lavender border-2 border-outline-variant overflow-hidden flex items-center justify-center font-bold">{activePerson.avatar ? <img src={activePerson.avatar} alt="" className="w-full h-full object-cover" /> : activePerson.name?.slice(0, 1) || '?'}</div><div className="min-w-0"><p className="font-bold text-sm truncate">{activePerson.name || 'Developer'}</p><p className="font-label-mono text-[8px] uppercase text-on-surface-variant truncate">{displayRole(activePerson.role || 'member')} {activePerson.level ? `· L${activePerson.level}` : ''}</p></div></div> : <p className="font-label-mono text-[10px] uppercase text-on-surface-variant">Select a conversation</p>}
          <div className="flex items-center gap-2 font-label-mono text-[8px] uppercase shrink-0">{connected ? <><Wifi className="w-3.5 h-3.5 text-primary" /> Connected</> : <><WifiOff className="w-3.5 h-3.5" /> Offline</>}</div>
        </header>

        {messagingError && <div className="mx-4 mt-3 px-3 py-2 border-2 border-outline-variant bg-dc-pink/40 font-label-mono text-[8px] uppercase">{messagingError}</div>}

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {!activeConversation ? <div className="h-full flex items-center justify-center text-center text-on-surface-variant"><div><MessageCircle className="w-10 h-10 mx-auto mb-3" /><p className="font-label-mono text-[10px] uppercase font-bold">{startingRecipient ? 'Opening conversation' : 'Start a conversation'}</p><p className="text-xs mt-2 max-w-sm">{startingRecipient ? 'Connecting you to this member…' : 'Select New message to find a member, then send your first message.'}</p>{startingRecipient && <Loader2 className="w-5 h-5 animate-spin mx-auto mt-3" />}</div></div> : loading ? <div className="h-full flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div> : <>{messages.length === 0 && <div className="text-center py-8 text-on-surface-variant"><p className="font-label-mono text-[9px] uppercase">New conversation</p><p className="text-xs mt-2">Say hello to {activePerson?.name || 'this developer'}.</p></div>}{messages.map((message) => { const mine = message.sender_clerk_user_id === clerkUser?.id; return <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[75%] px-3 py-2 border-2 border-outline-variant ${mine ? 'bg-dc-blue' : 'bg-surface'}`}><p className="text-sm whitespace-pre-wrap break-words">{message.body}</p><p className="font-label-mono text-[7px] uppercase text-on-surface-variant mt-1">{new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p></div></div>; })}{typing && <p className="font-label-mono text-[8px] uppercase text-on-surface-variant">Typing…</p>}</>}
        </div>

        {activeConversation && <form onSubmit={(event) => { event.preventDefault(); sendMessage(); }} className="p-3 border-t-2 border-outline-variant flex gap-2"><input value={draft} onChange={(event) => handleDraftChange(event.target.value)} placeholder={connected ? 'Write a message…' : 'Connecting…'} disabled={!connected} maxLength={4000} className="flex-1 bg-surface border-2 border-outline-variant px-3 py-3 text-sm outline-none focus:border-primary disabled:opacity-50" /><button type="submit" disabled={!draft.trim() || !connected} className="px-4 bg-primary text-on-primary border-2 border-outline-variant font-bold disabled:opacity-40" aria-label="Send message"><Send className="w-4 h-4" /></button></form>}
      </main>

      {pickerOpen && <div className="absolute inset-0 z-10 bg-background flex flex-col">
        <header className="h-16 shrink-0 border-b-2 border-outline-variant px-4 flex items-center gap-3"><button onClick={() => setPickerOpen(false)} className="p-2 border-2 border-outline-variant hover:bg-dc-blue" aria-label="Back"><ArrowLeft className="w-4 h-4" /></button><div><p className="font-label-mono text-[10px] uppercase font-bold">New message</p><p className="text-[10px] text-on-surface-variant mt-1">Choose a DevCollective member</p></div></header>
        <div className="p-4 border-b-2 border-outline-variant"><div className="flex items-center gap-2 bg-surface border-2 border-outline-variant px-3 py-2.5"><Search className="w-4 h-4 shrink-0 text-on-surface-variant" /><input autoFocus value={memberSearch} onChange={(event) => setMemberSearch(event.target.value)} placeholder="Search name, college, role or branch…" className="w-full bg-transparent outline-none text-sm" /></div></div>
        <div className="flex-1 overflow-y-auto p-3">
          {membersLoading ? <div className="h-full flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div> : membersError ? <div className="h-full flex items-center justify-center text-center px-6"><div><p className="font-label-mono text-[9px] uppercase font-bold">Could not load members</p><p className="text-xs mt-2 text-on-surface-variant">{membersError}</p><button onClick={() => setMemberSearch((value) => value + ' ')} className="mt-4 px-3 py-2 border-2 border-outline-variant bg-dc-yellow font-label-mono text-[8px] uppercase font-bold">Try again</button></div></div> : members.length === 0 ? <div className="h-full flex items-center justify-center text-center px-6"><div><UserRound className="w-9 h-9 mx-auto mb-3" /><p className="font-label-mono text-[9px] uppercase font-bold">No members found</p><p className="text-xs mt-2 text-on-surface-variant">Try a different name, college or role.</p></div></div> : <div className="space-y-2">{members.map((member) => <button key={member.id} onClick={() => selectMember(member)} disabled={!connected || Boolean(startingRecipient)} className="w-full flex items-center gap-3 p-3 text-left bg-surface border-2 border-outline-variant hover:bg-dc-blue/20 disabled:opacity-50 disabled:cursor-not-allowed">
            <div className="w-11 h-11 shrink-0 border-2 border-outline-variant bg-dc-yellow overflow-hidden flex items-center justify-center font-bold">{member.avatar ? <img src={member.avatar} alt="" className="w-full h-full object-cover" /> : member.name.slice(0, 1).toUpperCase()}</div>
            <div className="min-w-0 flex-1"><p className="font-bold text-sm truncate">{member.name}</p><p className="font-label-mono text-[8px] uppercase text-on-surface-variant mt-1 truncate">{displayRole(member.role)} · Level {member.level}</p>{member.college && <p className="text-[10px] text-on-surface-variant truncate mt-0.5">{member.college}</p>}{member.skills.length > 0 && <p className="font-label-mono text-[7px] uppercase text-on-surface-variant truncate mt-1">{member.skills.join(' · ')}</p>}</div><span className="shrink-0 px-2 py-1 bg-dc-mint border-2 border-outline-variant font-label-mono text-[8px] uppercase font-bold">Message</span>
          </button>)}</div>}
        </div>
        {!connected && <div className="p-3 border-t-2 border-outline-variant bg-dc-pink/30 font-label-mono text-[8px] uppercase text-center">Messaging is reconnecting. Member selection will be available when connected.</div>}
      </div>}
    </section>}
  </>;
};
