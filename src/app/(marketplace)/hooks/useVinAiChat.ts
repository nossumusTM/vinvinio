'use client';

import { create } from 'zustand';

export type AiRole = 'assistant' | 'user';

export interface AiMessage {
  id: string;
  role: AiRole;
  messageType?: 'text' | 'audio';
  content: string;
  createdAt: string;
  audioUrl?: string;
  audioDurationMs?: number;
}

export interface AiListing {
  id: string;
  title: string;
  category: string;
  location: string;
  badge?: string;
  description: string;
  image: string;
}

interface VinAiState {
  messages: AiMessage[];
  recommendations: AiListing[];
  initialized: boolean;
  isSending: boolean;
  init: () => void;
  sendMessage: (content: string, options?: { audioUrl?: string; audioDurationMs?: number }) => Promise<void>;
  clear: () => void;
}

const STORAGE_KEY = 'vin_ai_conversation';
const welcomeMessage: AiMessage = {
  id: 'vin-ai-welcome',
  role: 'assistant',
  content:
    "Hi, I'm AI Force. Ask me about destinations, dates, or what's your plan today? I'll bring back the most relevant services and experiences you can try via Vinvin.",
  createdAt: new Date().toISOString(),
};

const AI_FORCE_ASSISTANT = {
  id: 'vin-ai-assistant',
  name: 'AI Force',
  image: undefined,
};

const persistPayload = (payload: { messages: AiMessage[]; recommendations: AiListing[] }) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
};

const loadState = (): { messages: AiMessage[]; recommendations: AiListing[] } => {
  if (typeof window === 'undefined') return { messages: [welcomeMessage], recommendations: [] };
  const cached = localStorage.getItem(STORAGE_KEY);
  if (!cached) return { messages: [welcomeMessage], recommendations: [] };
  try {
    const parsed = JSON.parse(cached) as Partial<{ messages: AiMessage[]; recommendations: AiListing[] }>;
    const messages = Array.isArray(parsed?.messages) && parsed.messages.length > 0 ? parsed.messages : [welcomeMessage];
    const recommendations = Array.isArray(parsed?.recommendations) ? parsed.recommendations : [];
    return { messages, recommendations };
  } catch (error) {
    console.error('Failed to parse cached AI Force messages', error);
  }
  return { messages: [welcomeMessage], recommendations: [] };
};

const generateId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const useVinAiChat = create<VinAiState>((set, get) => ({
  messages: [],
  recommendations: [],
  initialized: false,
  isSending: false,
  init: () => {
    if (get().initialized) return;
    const { messages, recommendations } = loadState();
    set({ messages, recommendations, initialized: true });
  },
  clear: () => {
    const resetMessages = [welcomeMessage];
    persistPayload({ messages: resetMessages, recommendations: [] });
    set({ messages: resetMessages, recommendations: [] });
  },
  sendMessage: async (content: string, options?: { audioUrl?: string; audioDurationMs?: number }) => {
    const trimmed = content.trim();
    if (!trimmed) return;

    const userMessage: AiMessage = {
      id: generateId(),
      role: 'user',
      messageType: options?.audioUrl ? 'audio' : 'text',
      content: trimmed,
      createdAt: new Date().toISOString(),
      audioUrl: options?.audioUrl,
      audioDurationMs: options?.audioDurationMs,
    };

    const optimisticMessages = [...get().messages, userMessage];
    const optimisticRecommendations = get().recommendations;
    persistPayload({ messages: optimisticMessages, recommendations: optimisticRecommendations });
    set({ messages: optimisticMessages, isSending: true, recommendations: optimisticRecommendations });

    try {
      const res = await fetch('/api/vin-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: optimisticMessages.map(({ role, content }) => ({ role, content })),
        }),
      });

      const data = await res.json();
      const assistantMessage: AiMessage = {
        id: generateId(),
        role: 'assistant',
        content:
          data?.reply ||
          "Here's a quick list inspired by your request. Tell me more so I can refine the matches!",
        createdAt: new Date().toISOString(),
      };

      const updatedMessages = [...optimisticMessages, assistantMessage];
      const apiRecommendations = Array.isArray(data?.recommendations) ? data.recommendations : optimisticRecommendations;
      persistPayload({ messages: updatedMessages, recommendations: apiRecommendations });
      set({ messages: updatedMessages, recommendations: apiRecommendations });
    } catch (error) {
      console.error('AI Force failed to respond', error);
      const fallback: AiMessage = {
        id: generateId(),
        role: 'assistant',
        content:
          "I'm having trouble reaching the model right now. Try again in a moment or adjust your prompt.",
        createdAt: new Date().toISOString(),
      };
      const updatedMessages = [...optimisticMessages, fallback];
      persistPayload({ messages: updatedMessages, recommendations: optimisticRecommendations });
      set({ messages: updatedMessages, recommendations: optimisticRecommendations });
    } finally {
      set({ isSending: false });
    }
  },
}));

export default useVinAiChat;
export { AI_FORCE_ASSISTANT };
// export type { AiMessage };