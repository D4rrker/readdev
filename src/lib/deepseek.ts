import OpenAI from 'openai';

export const client = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: import.meta.env.DEEPSEEK_API_KEY,
});
