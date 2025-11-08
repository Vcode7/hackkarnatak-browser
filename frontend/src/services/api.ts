import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
});

// Add request interceptor for auth
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('session_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

export interface ChatRequest {
  message: string;
  conversation_id?: string;
}

export interface ChatResponse {
  response: string;
  conversation_id: string;
  timestamp: string;
}

export const sendMessage = async (message: string, conversationId?: string): Promise<ChatResponse> => {
  const response = await api.post<ChatResponse>('/api/ai/chat', {
    message,
    conversation_id: conversationId,
  });
  return response.data;
};

export const checkFocusMode = async (url: string) => {
  const response = await api.post('/api/focus/check', { url });
  return response.data;
};

export const getDownloads = async () => {
  const response = await api.get('/api/downloads');
  return response.data;
};

export default api;

