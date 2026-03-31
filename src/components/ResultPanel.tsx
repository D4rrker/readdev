import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import { extractSection } from '@/lib/streamHelpers';
import { markdownComponents } from '@/components/MarkdownComponents';
import type { StreamState } from '@/types/types';

interface Props {
  stream: StreamState;
}

export default function ResultPanel({ stream }: Props) {
  const suggestions = extractSection(stream.markdown, 'Sugerencias');

  const markdownWithoutSuggestions = stream.markdown
    .replace(/## Sugerencias[\s\S]*$/i, '')
    .trim();

  const referenceLinks = stream.links || [];
  const hasLinks = referenceLinks.length > 0;

  if (!stream.markdown && !stream.error && !stream.loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-[#2e2e38]">El resultado aparecerá aquí</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_500px]">
      <div className="flex flex-col gap-4">
        {stream.error && (
          <p className="rounded-lg px-4 py-2.5 font-mono text-sm text-red-400">
            {stream.error}
          </p>
        )}

        {markdownWithoutSuggestions && (
          <div className="flex flex-col gap-4">
            <ReactMarkdown
              rehypePlugins={[
                [rehypeHighlight, { detect: true, aliases: { astro: 'xml' } }],
              ]}
              components={markdownComponents}
            >
              {markdownWithoutSuggestions}
            </ReactMarkdown>
            {stream.loading && (
              <span className="inline-block h-3.5 w-0.5 animate-pulse bg-[#c97d4e] align-middle" />
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-8">
        {suggestions.length > 0 && (
          <div className="flex flex-col gap-3">
            <div className="mt-5 mb-2 flex items-center gap-1.5 first:mt-0">
              <span className="size-1.5 rounded-full bg-[#c97d4e]" />
              <span className="font-mono text-[10px] font-medium tracking-widest text-[#c97d4e] uppercase">
                Sugerencias
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() =>
                    window.dispatchEvent(
                      new CustomEvent('docsimple:pill', { detail: s })
                    )
                  }
                  className="cursor-pointer rounded-lg border border-[#1e2028] px-3 py-2.5 text-left text-xs text-[#6b6b75] transition-colors hover:border-[#c97d4e] hover:text-[#c97d4e]"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {hasLinks && stream.done && (
          <div className="flex flex-col gap-3">
            <div className="animate-fade-in-up mt-5 mb-2 flex items-center gap-1.5 first:mt-0">
              <span className="size-1.5 rounded-full bg-[#c97d4e]" />
              <span className="font-mono text-[10px] font-medium tracking-widest text-[#c97d4e] uppercase">
                Fuentes
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {referenceLinks.map((link, i) => {
                const { hostname } = new URL(link.url);

                const faviconUrl = `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;

                return (
                  <a
                    key={i}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ animationDelay: `${i * 100}ms` }}
                    className="group animate-fade-in-up flex cursor-pointer items-center gap-3 rounded-lg border border-[#1e2028] bg-[#0e0f11] p-3 text-left transition-colors hover:border-[#2a2d38] hover:bg-[#13141a]"
                  >
                    <div className="size-8 shrink-0 rounded-md border border-[#1e2028] bg-[#13141a] p-1.5 group-hover:border-[#2a2d38]">
                      <img
                        src={faviconUrl}
                        alt=""
                        className="size-full object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>

                    <div className="flex flex-col gap-0.5">
                      <span className="line-clamp-1 text-xs font-medium text-[#b8b4ac] group-hover:text-[#c97d4e]">
                        {link.title}
                      </span>
                      <span className="text-[10px] text-[#4a4a52] group-hover:text-[#6b6b75]">
                        {hostname}
                      </span>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
