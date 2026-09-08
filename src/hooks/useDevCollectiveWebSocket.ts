import { useAuth as useClerkAuth } from '@clerk/react';
import { useCallback, useEffect, useRef, useState } from 'react';

export type MessagingEvent = {
  type: string;
  [key: string]: unknown;
};

export function useDevCollectiveWebSocket() {
  const { getToken, isSignedIn } = useClerkAuth();
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const listenersRef = useRef(new Set<(event: MessagingEvent) => void>());
  const [connected, setConnected] = useState(false);

  const subscribe = useCallback((listener: (event: MessagingEvent) => void) => {
    listenersRef.current.add(listener);
    return () => listenersRef.current.delete(listener);
  }, []);

  const connect = useCallback(async () => {
    if (!isSignedIn || socketRef.current?.readyState === WebSocket.OPEN || socketRef.current?.readyState === WebSocket.CONNECTING) return;
    const token = await getToken();
    if (!token) return;

    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const host = window.location.hostname;
    const port = import.meta.env.VITE_WS_PORT || '3001';
    const socket = new WebSocket(`${protocol}://${host}:${port}/ws`);
    socketRef.current = socket;

    socket.onopen = () => socket.send(JSON.stringify({ type: 'auth', token }));
    socket.onmessage = (message) => {
      try {
        const event = JSON.parse(message.data) as MessagingEvent;
        if (event.type === 'auth:ok') setConnected(true);
        for (const listener of listenersRef.current) listener(event);
      } catch (error) {
        console.error('Invalid DevCollective WebSocket event:', error);
      }
    };
    socket.onclose = () => {
      setConnected(false);
      socketRef.current = null;
      if (isSignedIn) reconnectTimerRef.current = window.setTimeout(() => void connect(), 1500);
    };
    socket.onerror = () => setConnected(false);
  }, [getToken, isSignedIn]);

  const send = useCallback((event: MessagingEvent) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return false;
    socket.send(JSON.stringify(event));
    return true;
  }, []);

  useEffect(() => {
    void connect();
    return () => {
      if (reconnectTimerRef.current) window.clearTimeout(reconnectTimerRef.current);
      socketRef.current?.close();
      socketRef.current = null;
      setConnected(false);
    };
  }, [connect]);

  return { connected, send, subscribe, reconnect: connect };
}
