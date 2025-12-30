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
  criteriaMet: boolean;
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
    "Hi, I'm AI Force 👋 Tell me your country or region so I can curate the best experiences. You can also tap “Use my location.”",
  createdAt: new Date().toISOString(),
};

const AI_FORCE_ASSISTANT = {
  id: 'vin-ai-assistant',
  name: 'AI Force',
  image: undefined,
};

const persistPayload = (payload: {
  messages: AiMessage[];
  recommendations: AiListing[];
  criteriaMet: boolean;
}) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
};

const loadState = (): { messages: AiMessage[]; recommendations: AiListing[]; criteriaMet: boolean } => {
  if (typeof window === 'undefined') {
    return { messages: [welcomeMessage], recommendations: [], criteriaMet: false };
  }
  const cached = localStorage.getItem(STORAGE_KEY);
  if (!cached) return { messages: [welcomeMessage], recommendations: [], criteriaMet: false };
  try {
const parsed = JSON.parse(cached) as Partial<{
      messages: AiMessage[];
      recommendations: AiListing[];
      criteriaMet: boolean;
    }>;
    const messages = Array.isArray(parsed?.messages) && parsed.messages.length > 0 ? parsed.messages : [welcomeMessage];
    const recommendations = Array.isArray(parsed?.recommendations) ? parsed.recommendations : [];
    return { messages, recommendations, criteriaMet: Boolean(parsed?.criteriaMet) };
  } catch (error) {
    console.error('Failed to parse cached AI Force messages', error);
  }
  return { messages: [welcomeMessage], recommendations: [], criteriaMet: false };
};

const generateId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const useVinAiChat = create<VinAiState>((set, get) => ({
  messages: [],
  recommendations: [],
  criteriaMet: false,
  initialized: false,
  isSending: false,
  init: () => {
    if (get().initialized) return;
    const { messages, recommendations, criteriaMet } = loadState();
    set({ messages, recommendations, criteriaMet, initialized: true });
  },
  clear: () => {
    const resetMessages = [welcomeMessage];
    persistPayload({ messages: resetMessages, recommendations: [], criteriaMet: false });
    set({ messages: resetMessages, recommendations: [], criteriaMet: false });
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
    const optimisticCriteriaMet = get().criteriaMet;
    persistPayload({
      messages: optimisticMessages,
      recommendations: optimisticRecommendations,
      criteriaMet: optimisticCriteriaMet,
    });
    set({
      messages: optimisticMessages,
      isSending: true,
      recommendations: optimisticRecommendations,
      criteriaMet: optimisticCriteriaMet,
    });

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
      const criteriaMet = Boolean(data?.criteriaMet);
      persistPayload({ messages: updatedMessages, recommendations: apiRecommendations, criteriaMet });
      set({ messages: updatedMessages, recommendations: apiRecommendations, criteriaMet });
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
      persistPayload({
        messages: updatedMessages,
        recommendations: optimisticRecommendations,
        criteriaMet: optimisticCriteriaMet,
      });
      set({
        messages: updatedMessages,
        recommendations: optimisticRecommendations,
        criteriaMet: optimisticCriteriaMet,
      });
    } finally {
      set({ isSending: false });
    }
  },
}));

export default useVinAiChat;
export { AI_FORCE_ASSISTANT };
// export type { AiMessage };