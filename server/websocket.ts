import { createServer } from 'node:http';
import { verifyToken } from '@clerk/backend';
import { WebSocketServer, WebSocket } from 'ws';
import { supabaseAdmin } from './supabase';

type Client = {
  socket: WebSocket;
  userId: string;
  conversationId?: string;
};

type IncomingEvent = {
  type?: string;
  conversationId?: string;
  recipientId?: string;
  messageId?: string;
  body?: string;
};

const PORT = Number(process.env.WS_PORT || 3001);
const clients = new Set<Client>();
const presence = new Map<string, number>();

const send = (socket: WebSocket, type: string, payload: Record<string, unknown> = {}) => {
  if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type, ...payload }));
};

const broadcast = (type: string, payload: Record<string, unknown>, predicate: (client: Client) => boolean) => {
  for (const client of clients) if (predicate(client)) send(client.socket, type, payload);
};

async function authenticate(token: string): Promise<string | null> {
  try {
    const authorizedParties = process.env.CLERK_AUTHORIZED_PARTIES
      ?.split(',')
      .map((value) => value.trim())
      .filter(Boolean);

    const result = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
      ...(authorizedParties?.length ? { authorizedParties } : {}),
    });

    return typeof result?.sub === 'string' ? result.sub : null;
  } catch (error) {
    console.error('[ws] Clerk token verification failed:', error);
    return null;
  }
}

async function isMember(conversationId: string, userId: string) {
  if (!supabaseAdmin) return false;
  const { data, error } = await supabaseAdmin
    .from('devcollective_conversation_members')
    .select('conversation_id')
    .eq('conversation_id', conversationId)
    .eq('clerk_user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

async function ensureDirectConversation(userA: string, userB: string) {
  if (!supabaseAdmin) throw new Error('Supabase is not configured.');
  if (userA === userB) throw new Error('You cannot message yourself.');

  const { data: memberships, error: membershipError } = await supabaseAdmin
    .from('devcollective_conversation_members')
    .select('conversation_id, clerk_user_id')
    .in('clerk_user_id', [userA, userB]);
  if (membershipError) throw membershipError;

  const counts = new Map<string, Set<string>>();
  for (const row of memberships || []) {
    const set = counts.get(row.conversation_id) || new Set<string>();
    set.add(row.clerk_user_id);
    counts.set(row.conversation_id, set);
  }
  for (const [conversationId, members] of counts) {
    if (members.size === 2 && members.has(userA) && members.has(userB)) return conversationId;
  }

  const { data: conversation, error: conversationError } = await supabaseAdmin
    .from('devcollective_conversations')
    .insert({ kind: 'direct', created_by: userA })
    .select('id')
    .single();
  if (conversationError || !conversation) throw conversationError || new Error('Could not create conversation.');

  const { error: memberError } = await supabaseAdmin
    .from('devcollective_conversation_members')
    .insert([
      { conversation_id: conversation.id, clerk_user_id: userA },
      { conversation_id: conversation.id, clerk_user_id: userB },
    ]);
  if (memberError) throw memberError;
  return conversation.id as string;
}

async function loadConversationList(userId: string) {
  if (!supabaseAdmin) throw new Error('Supabase is not configured.');
  const { data: memberships, error } = await supabaseAdmin
    .from('devcollective_conversation_members')
    .select('conversation_id,last_read_at,devcollective_conversations(id,kind,created_at,updated_at,last_message_at)')
    .eq('clerk_user_id', userId)
    .order('last_message_at', { ascending: false, foreignTable: 'devcollective_conversations' });
  if (error) throw error;

  const conversationIds = (memberships || []).map((row: any) => row.conversation_id);
  if (!conversationIds.length) return [];
  const { data: members, error: memberError } = await supabaseAdmin
    .from('devcollective_conversation_members')
    .select('conversation_id,clerk_user_id')
    .in('conversation_id', conversationIds);
  if (memberError) throw memberError;

  const otherIds = Array.from(new Set((members || []).filter((m: any) => m.clerk_user_id !== userId).map((m: any) => m.clerk_user_id)));
  const profiles = otherIds.length
    ? await supabaseAdmin.from('devcollective_profiles').select('clerk_user_id,name,avatar,role,level,rep').in('clerk_user_id', otherIds)
    : { data: [], error: null };
  if (profiles.error) throw profiles.error;
  const profileMap = new Map((profiles.data || []).map((p: any) => [p.clerk_user_id, p]));

  return (memberships || []).map((row: any) => {
    const other = (members || []).find((m: any) => m.conversation_id === row.conversation_id && m.clerk_user_id !== userId);
    const profile = other ? profileMap.get(other.clerk_user_id) : null;
    return {
      id: row.conversation_id,
      kind: row.devcollective_conversations?.kind || 'direct',
      lastMessageAt: row.devcollective_conversations?.last_message_at || null,
      lastReadAt: row.last_read_at || null,
      participant: profile ? { id: profile.clerk_user_id, name: profile.name, avatar: profile.avatar, role: profile.role, level: profile.level, rep: profile.rep } : null,
    };
  });
}

async function loadMessages(conversationId: string, userId: string) {
  if (!await isMember(conversationId, userId)) throw new Error('You are not a member of this conversation.');
  const { data, error } = await supabaseAdmin!
    .from('devcollective_messages')
    .select('id,conversation_id,sender_clerk_user_id,body,created_at,read_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(100);
  if (error) throw error;
  return data || [];
}

async function handleEvent(client: Client, event: IncomingEvent) {
  switch (event.type) {
    case 'conversation:list': {
      send(client.socket, 'conversation:list', { conversations: await loadConversationList(client.userId) });
      return;
    }
    case 'conversation:open': {
      if (!event.conversationId || !await isMember(event.conversationId, client.userId)) throw new Error('Conversation access denied.');
      client.conversationId = event.conversationId;
      send(client.socket, 'conversation:history', { conversationId: event.conversationId, messages: await loadMessages(event.conversationId, client.userId) });
      return;
    }
    case 'conversation:start': {
      if (!event.recipientId) throw new Error('recipientId is required.');
      const conversationId = await ensureDirectConversation(client.userId, event.recipientId);
      client.conversationId = conversationId;
      const messages = await loadMessages(conversationId, client.userId);
      send(client.socket, 'conversation:started', { conversationId, messages });
      broadcast('conversation:list:invalidate', { conversationId }, (other) => other.userId === client.userId || other.userId === event.recipientId);
      return;
    }
    case 'message:send': {
      const body = String(event.body || '').trim();
      if (!event.conversationId || !body) throw new Error('conversationId and message body are required.');
      if (body.length > 4000) throw new Error('Message is too long.');
      if (!await isMember(event.conversationId, client.userId)) throw new Error('Conversation access denied.');
      const { data, error } = await supabaseAdmin!
        .from('devcollective_messages')
        .insert({ conversation_id: event.conversationId, sender_clerk_user_id: client.userId, body })
        .select('id,conversation_id,sender_clerk_user_id,body,created_at,read_at')
        .single();
      if (error) throw error;
      broadcast('message:new', { message: data }, (other) => other.userId === client.userId || other.conversationId === event.conversationId);
      return;
    }
    case 'message:read': {
      if (!event.conversationId || !event.messageId || !await isMember(event.conversationId, client.userId)) throw new Error('Conversation access denied.');
      await supabaseAdmin!.from('devcollective_messages').update({ read_at: new Date().toISOString() }).eq('id', event.messageId).eq('conversation_id', event.conversationId);
      await supabaseAdmin!.from('devcollective_conversation_members').update({ last_read_at: new Date().toISOString() }).eq('conversation_id', event.conversationId).eq('clerk_user_id', client.userId);
      broadcast('message:read', { conversationId: event.conversationId, messageId: event.messageId, userId: client.userId }, (other) => other.conversationId === event.conversationId);
      return;
    }
    case 'typing:start':
    case 'typing:stop': {
      if (!event.conversationId || !await isMember(event.conversationId, client.userId)) throw new Error('Conversation access denied.');
      broadcast(event.type, { conversationId: event.conversationId, userId: client.userId }, (other) => other !== client && other.conversationId === event.conversationId);
      return;
    }
    case 'presence:subscribe': {
      const ids = Array.isArray((event as any).userIds) ? (event as any).userIds as string[] : [];
      send(client.socket, 'presence:update', { users: ids.map((id) => ({ userId: id, online: (presence.get(id) || 0) > 0 })) });
      return;
    }
    default:
      throw new Error('Unknown WebSocket event.');
  }
}

export function startWebSocketServer() {
  const httpServer = createServer();
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (socket) => {
    let client: Client | null = null;
    let authenticated = false;

    const authTimeout = setTimeout(() => {
      if (!authenticated) socket.close(1008, 'Authentication timeout');
    }, 8000);

    socket.on('message', async (raw) => {
      try {
        const event = JSON.parse(raw.toString()) as IncomingEvent & { token?: string };
        if (!authenticated) {
          if (event.type !== 'auth' || !event.token) throw new Error('First event must be auth.');
          const userId = await authenticate(event.token);
          if (!userId) throw new Error('Invalid Clerk session token.');
          client = { socket, userId };
          authenticated = true;
          clearTimeout(authTimeout);
          clients.add(client);
          presence.set(userId, (presence.get(userId) || 0) + 1);
          broadcast('presence:update', { users: [{ userId, online: true }] }, (other) => other !== client);
          send(socket, 'auth:ok', { userId });
          send(socket, 'presence:update', { users: [{ userId, online: true }] });
          return;
        }
        if (!client) throw new Error('Not authenticated.');
        await handleEvent(client, event);
      } catch (error: any) {
        send(socket, 'error', { message: error?.message || 'WebSocket request failed.' });
      }
    });

    socket.on('close', () => {
      clearTimeout(authTimeout);
      if (!client) return;
      clients.delete(client);
      const count = Math.max(0, (presence.get(client.userId) || 1) - 1);
      if (count === 0) presence.delete(client.userId); else presence.set(client.userId, count);
      if (count === 0) broadcast('presence:update', { users: [{ userId: client.userId, online: false }] }, (other) => other.userId !== client!.userId);
    });
  });

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`[ws] DevCollective WebSocket server running on ws://0.0.0.0:${PORT}/ws`);
  });

  return httpServer;
}
