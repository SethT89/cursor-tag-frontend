import { useEffect, useRef, useCallback, useState } from 'react';
import { ServerMessage } from './gameTypes';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080';

type MessageHandler = (msg: ServerMessage) => void;

export function useGameSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const handlersRef = useRef<MessageHandler[]>([]);
  const [connected, setConnected] = useState(false);
  const [connectingSeconds, setConnectingSeconds] = useState(0);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>();
  const connectStartRef = useRef<number>(Date.now());
  const tickerRef = useRef<ReturnType<typeof setInterval>>();

  const startTicker = useCallback(() => {
    connectStartRef.current = Date.now();
    setConnectingSeconds(0);
    if (tickerRef.current) clearInterval(tickerRef.current);
    tickerRef.current = setInterval(() => {
      setConnectingSeconds(Math.floor((Date.now() - connectStartRef.current) / 1000));
    }, 1000);
  }, []);

  const stopTicker = useCallback(() => {
    if (tickerRef.current) clearInterval(tickerRef.current);
    setConnectingSeconds(0);
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    startTicker();
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;
    ws.onopen = () => {
      setConnected(true);
      stopTicker();
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };
    ws.onmessage = (event) => {
      try {
        const msg: ServerMessage = JSON.parse(event.data);
        handlersRef.current.forEach(h => h(msg));
      } catch {}
    };
    ws.onclose = () => {
      setConnected(false);
      startTicker();
      reconnectTimer.current = setTimeout(connect, 2000);
    };
    ws.onerror = () => { ws.close(); };
  }, [startTicker, stopTicker]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (tickerRef.current) clearInterval(tickerRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const send = useCallback((msg: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  const onMessage = useCallback((handler: MessageHandler) => {
    handlersRef.current.push(handler);
    return () => {
      handlersRef.current = handlersRef.current.filter(h => h !== handler);
    };
  }, []);

  return { send, onMessage, connected, connectingSeconds };
}
