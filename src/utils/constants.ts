import type { FormState, StreamState } from '@/types/types';

export const INITIAL_FORM: FormState = { mode: 'url', input: '' };

export const INITIAL_STREAM: StreamState = {
  markdown: '',
  loading: false,
  error: '',
  done: false,
  links: [],
};
