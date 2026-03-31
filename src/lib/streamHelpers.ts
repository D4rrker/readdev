import type { StreamEvent, ExtractSections } from '@/types/types';

export function parseSSELines(buffer: string): {
  events: StreamEvent[];
  remaining: string;
} {
  const lines = buffer.split('\n\n');
  const remaining = lines.pop() ?? '';
  const events: StreamEvent[] = [];
  for (const line of lines) {
    if (!line.startsWith('data: ')) continue;
    try {
      events.push(JSON.parse(line.slice(6)));
    } catch {}
  }
  return { events, remaining };
}

export function extractSection(
  markdown: string,
  section: ExtractSections
): string[] {
  const regex = new RegExp(`## ${section}\\n([\\s\\S]*?)(?=\\n##|$)`, 'i');
  const match = markdown.match(regex);
  if (!match) return [];
  return match[1]
    .split('\n')
    .map((l) => l.replace(/^[\s\-\*\d\.]\s*/, '').trim())
    .filter(Boolean);
}

export function extractMainContent(html: string): string {
  let clean = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, '');

  const mainMatch =
    clean.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i) ||
    clean.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i);

  if (mainMatch) clean = mainMatch[1];

  clean = clean
    .replace(/<[^>]*>/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

  return clean.slice(0, 8000);
}
