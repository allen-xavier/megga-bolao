import axios from 'axios';

const fallbackBase =
  process.env.NEXT_PUBLIC_API_BASE ??
  (typeof window !== 'undefined'
    ? `${window.location.origin}/api`
    : 'https://app.allentiomolu.com.br/api');

export const api = axios.create({
  baseURL: fallbackBase,
  withCredentials: true,
});
