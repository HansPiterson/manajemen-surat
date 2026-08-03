import { useEffect, useRef, useCallback } from 'react';
import { api } from '../lib/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://10.2.9.230:3001/api';

export function useSSE(onEvent) {
  const esRef = useRef(null);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const connect = useCallback(() => {
    const token = api.getToken();
    if (!token) return;
    if (esRef.current) esRef.current.close();

    const es = new EventSource(`${API_URL}/events?token=${token}`);
    esRef.current = es;

    es.addEventListener('surat_created', (e) => {
      onEventRef.current?.('surat_created', JSON.parse(e.data));
    });
    es.addEventListener('surat_updated', (e) => {
      onEventRef.current?.('surat_updated', JSON.parse(e.data));
    });
    es.addEventListener('connected', () => {
      console.log('[SSE] connected');
    });
    es.onerror = () => {
      es.close();
      setTimeout(connect, 5000);
    };
  }, []);

  useEffect(() => {
    connect();
    return () => esRef.current?.close();
  }, [connect]);
}
