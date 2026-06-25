import axios from 'axios';

export const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL as string | undefined) ?? 'https://gencontent-zpei.onrender.com/api',
  headers: { 'Content-Type': 'application/json' },
});

export interface Script {
  id: string;
  title: string;
  editionType: 'MORNING' | 'EVENING' | 'MANUAL';
  content?: string;
  wordCount: number;
  version: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  aiProvider: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}

export interface ScriptListResponse {
  scripts: Script[];
  total: number;
  page: number;
  limit: number;
}

export interface Job {
  id: string;
  jobType: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  startedAt: string | null;
  finishedAt: string | null;
  errorMessage: string | null;
  createdAt: string;
}

export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  matchTime: string;
  status: string;
  competition: string;
  venue: string | null;
}

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  source: string;
  hotScore: number;
  category: string | null;
  lang: string;
  publishedAt: string;
  url?: string;
}

export interface SelectedNewsItem {
  id: string;
  title: string;
  content: string;
  source: string;
  lang?: string;
}

export interface CustomGeneratePayload {
  editionType: string;
  headlines: SelectedNewsItem[];
  matchResults: SelectedNewsItem[];
  matchOfDay: SelectedNewsItem;
  includeSection5: boolean;
}

// Scripts
export const getScripts = (params?: Record<string, string>) =>
  api.get<ScriptListResponse>('/scripts', { params }).then((r) => r.data);

export const getScript = (id: string) =>
  api.get<Script>(`/scripts/${id}`).then((r) => r.data);

export const generateScript = (editionType: string) =>
  api.post<Script>('/scripts/generate/sync', { editionType }).then((r) => r.data);

export const updateScript = (id: string, data: { title?: string; content?: string }) =>
  api.patch<Script>(`/scripts/${id}`, data).then((r) => r.data);

export const regenerateScript = (id: string) =>
  api.post<Script>('/scripts/regenerate', { id }).then((r) => r.data);

export const deleteScript = (id: string) =>
  api.delete(`/scripts/${id}`).then((r) => r.data);

export const translateScript = (id: string) =>
  api.get<{ contentVi: string }>(`/scripts/${id}/translate`).then((r) => r.data.contentVi);

// Jobs
export const getJobs = () =>
  api.get<Job[]>('/jobs').then((r) => r.data);

// Matches
export const getMatches = (params?: Record<string, string>) =>
  api.get<Match[]>('/matches', { params }).then((r) => r.data);

// News
export const getNews = (params?: Record<string, string>) =>
  api.get<NewsItem[]>('/news', { params }).then((r) => r.data);

export const refreshNews = () =>
  api.post<{ refreshed: number; message: string }>('/news/refresh').then((r) => r.data);

export const generateCustomScript = (payload: CustomGeneratePayload) =>
  api.post<Script>('/scripts/generate/custom', payload).then((r) => r.data);
