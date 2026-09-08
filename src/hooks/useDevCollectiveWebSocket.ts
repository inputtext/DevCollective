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
  const manuallyClosedRef = useRef(false);
  const listenersRef = useRef(new Set<(event: MessagingEvent) => void>());
  const [connected, setConnected] = useState(false);

  const subscribe = useCallback((listener: (event: MessagingEvent) => void) => {
    listenersRef.current.add(listener);
    return () => listenersRef.current.delete(listener);
  }, []);

  const connect = useCallback(async () => {
    if (manuallyClosedRef.current || !isSignedIn) return;
    if (socketRef.current?.readyState === WebSocket.OPEN || socketRef.current?.readyState === WebSocket.CONNECTING) return;

    const token = await getToken();
    if (!token || manuallyClosedRef.current || !isSignedIn) return;

    const configuredUrl = import.meta.env.VITE_WS_URL as string | undefined;
    let socketUrl: string;

    if (configuredUrl?.trim()) {
      const trimmedUrl = configuredUrl.trim();
      const baseUrl = trimmedUrl.endsWith('/') ? trimmedUrl.slice(0, -1) : trimmedUrl;
      socketUrl = `${baseUrl}/ws`;
    } else {
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const host = window.location.hostname;
      const port = import.meta.env.VITE_WS_PORT || '3001';
      socketUrl = `${protocol}://${host}:${port}/ws`;
    }

    const socket = new WebSocket(socketUrl);
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
      if (socketRef.current === socket) socketRef.current = null;
      if (!manuallyClosedRef.current && isSignedIn) {
        if (reconnectTimerRef.current) window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = window.setTimeout(() => {
          reconnectTimerRef.current = null;
          void connect();
        }, 1500);
      }
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
    manuallyClosedRef.current = false;
    void connect();

    return () => {
      manuallyClosedRef.current = true;
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      socketRef.current?.close();
      socketRef.current = null;
      setConnected(false);
    };
  }, [connect]);

  return { connected, send, subscribe, reconnect: connect };
}
