import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import ResultPanel from '@/components/ResultPanel';
import { useExplanation } from '@/hooks/useExplanation';
import { INITIAL_FORM } from '@/utils/constants';
import type { Mode, FormState } from '@/types/types';

export default function DocForm() {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [resultContainer, setResultContainer] = useState<Element | null>(null);

  const { stream, fetchExplanation } = useExplanation();

  const fetchRef = useRef<(value: string, mode: Mode) => Promise<void>>(
    undefined!
  );

  const setFormField = <K extends keyof FormState>(
    key: K,
    value: FormState[K]
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    const el = document.getElementById('result-panel');
    if (el) setResultContainer(el);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const suggestion = (e as CustomEvent<string>).detail;
      setForm((prev) => ({ ...prev, input: suggestion, mode: 'text' }));
      fetchRef.current?.(suggestion, 'text');
    };
    window.addEventListener('docsimple:pill', handler);
    return () => window.removeEventListener('docsimple:pill', handler);
  }, []);

  useEffect(() => {
    fetchRef.current = fetchExplanation;
  }, [fetchExplanation]);

  const handleSubmit = (e: React.ChangeEvent<HTMLFormElement>) => {
    e.preventDefault();
    fetchExplanation(form.input, form.mode);
  };

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="inline-flex gap-0.5 rounded-lg border border-[#1e2028] bg-[#13141a] p-1">
          {(['url', 'text'] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setFormField('mode', m)}
              className={`cursor-pointer rounded-md px-4 py-1.5 font-mono text-xs font-medium tracking-widest uppercase transition-colors ${
                form.mode === m
                  ? 'border border-[#2a2d38] bg-[#1c1e26] text-[#e8e4dc]'
                  : 'bg-transparent text-[#4a4a52] hover:text-[#8a8a95]'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {form.mode === 'url' ? (
            <input
              type="url"
              placeholder="https://docs.astro.build/en/guides/..."
              value={form.input}
              onChange={(e) => setFormField('input', e.target.value)}
              required
              className="w-full rounded-xl border border-[#1e2028] bg-[#13141a] px-4 py-3.5 font-mono text-sm text-[#e8e4dc] transition-colors outline-none placeholder:text-[#2e2e38] focus:border-[#c97d4e] focus:ring-2 focus:ring-[#c97d4e]/10"
            />
          ) : (
            <textarea
              placeholder="Pega aquí el fragmento de documentación que no entiendes..."
              value={form.input}
              onChange={(e) => setFormField('input', e.target.value)}
              rows={6}
              required
              className="w-full resize-none rounded-xl border border-[#1e2028] bg-[#13141a] px-4 py-3.5 font-mono text-sm text-[#e8e4dc] transition-colors outline-none placeholder:text-[#2e2e38] focus:border-[#c97d4e] focus:ring-2 focus:ring-[#c97d4e]/10"
            />
          )}

          <button
            type="submit"
            disabled={stream.loading}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#c97d4e] py-3.5 text-sm font-medium text-[#0e0f11] transition-colors hover:bg-[#d98e5e] active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-[#1c1e26] disabled:text-[#4a4a52]"
          >
            {stream.loading ? (
              <>
                <span className="size-3.5 animate-spin rounded-full border-2 border-[#2a2d38] border-t-[#c97d4e]" />
                Analizando...
              </>
            ) : (
              'Explicar →'
            )}
          </button>
        </form>
      </div>

      {resultContainer &&
        createPortal(<ResultPanel stream={stream} />, resultContainer)}
    </>
  );
}
