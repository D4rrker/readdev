import { useState, useCallback } from 'react';
import { parseSSELines } from '@/lib/streamHelpers';
import { INITIAL_STREAM } from '@/utils/constants';
import type { Mode, StreamState } from '@/types/types';

export const useExplanation = () => {
  const [stream, setStream] = useState<StreamState>(INITIAL_STREAM);

  const fetchExplanation = useCallback(async (value: string, mode: Mode) => {
    setStream({ ...INITIAL_STREAM, loading: true });

    try {
      const res = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, input: value }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const serverMessage = errorData.message || errorData.error;
        throw new Error(serverMessage || 'Algo salió mal. Inténtalo de nuevo.');
      }

      if (!res.body) throw new Error('No se recibió respuesta del servidor.');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value: chunk } = await reader.read();
        if (done) break;
        buffer += decoder.decode(chunk, { stream: true });
        const { events, remaining } = parseSSELines(buffer);
        buffer = remaining;

        for (const event of events) {
          if (event.type === 'links') {
            setStream((prev) => ({ ...prev, links: event.data }));
          } else if (event.type === 'chunk') {
            setStream((prev) => ({
              ...prev,
              markdown: prev.markdown + (event.text ?? ''),
            }));
          } else if (event.type === 'done') {
            setStream((prev) => ({ ...prev, loading: false, done: true }));
          } else if (event.type === 'error') {
            throw new Error(event.message);
          }
        }
      }
    } catch (err: unknown) {
      const isNetworkError = err instanceof TypeError;
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Algo salió mal. Inténtalo de nuevo.';
      setStream((prev) => ({
        ...prev,
        loading: false,
        error: isNetworkError
          ? 'Error de conexión con el servidor.'
          : errorMessage,
      }));
    }
  }, []);

  return { stream, fetchExplanation };
};
