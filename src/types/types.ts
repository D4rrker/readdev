export type ExtractSections =
  | 'Sugerencias'
  | 'Explicación'
  | 'Código'
  | 'Información';

export type Mode = 'url' | 'text';

export type StreamEvent =
  | { type: 'chunk'; text: string }
  | { type: 'done' }
  | { type: 'error'; message: string }
  | { type: 'links'; data: { title: string; url: string }[] };

export interface FormState {
  mode: Mode;
  input: string;
}

export interface StreamState {
  markdown: string;
  loading: boolean;
  error: string;
  done: boolean;
  links: { title: string; url: string }[];
}
