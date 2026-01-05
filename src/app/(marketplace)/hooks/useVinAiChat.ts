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
  slug?: string | null;
  title: string;
  category: string;
  location: string;
  badge?: string;
  description: string;
  image: string;
  vinPoints?: number;
  rating?: number;
  reviewCount?: number;
}

export interface AiMemory {
  location?: string | null;
  category?: string | null;
  dateRange?: { startDate: string; endDate: string } | null;
  guestCount?: number | null;
  keywords?: string[];
}

interface VinAiState {
  messages: AiMessage[];
  recommendations: AiListing[];
  criteriaMet: boolean;
  memory: AiMemory;
  initialized: boolean;
  isSending: boolean;
  isLoadingMore: boolean;
  hasMoreRecommendations: boolean; // ✅ add this
  init: () => void;
  sendMessage: (content: string, options?: { audioUrl?: string; audioDurationMs?: number }) => Promise<void>;
  loadMoreRecommendations: () => Promise<void>;
  clear: () => void;
}

const STORAGE_KEY = 'vin_ai_conversation';
const getTimeGreeting = (date = new Date()) => {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

const pickWelcomeVariant = (timeGreeting: string) => {
  const variants = [
    `## ${timeGreeting}, I'm AI Force 👋`,
    `## ${timeGreeting}! AI Force here 👋`,
    `## ${timeGreeting} — I’m AI Force 👋`,
  ];
  return variants[Math.floor(Math.random() * variants.length)] ?? variants[0];
};

const buildWelcomeMessage = (): AiMessage => {
  const intro = pickWelcomeVariant(getTimeGreeting());
  const content = [
    intro,
    "Let’s start with your destination.",
    "Choose a city or country, or tap “Use my location.”",
    '',
    '## How I can help you find the right stay',
    '• Tell me the kind of trip you want (romantic escape, family getaway, work retreat).',
    '• Share dates, budget range, number of guests, and must-haves.',
    '• I’ll search listings, highlight the best fits, and refine based on your feedback.',
  ].join('\n');
  return {
    id: `vin-ai-welcome-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    role: 'assistant',
    content,
    createdAt: new Date().toISOString(),
  };
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
  memory: AiMemory;
  hasMoreRecommendations?: boolean;
}) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
};

const loadState = (): {
  messages: AiMessage[];
  recommendations: AiListing[];
  criteriaMet: boolean;
  memory: AiMemory;
  hasMoreRecommendations: boolean;
} => {
  if (typeof window === 'undefined') {
    return { messages: [buildWelcomeMessage()], recommendations: [], criteriaMet: false, memory: {}, hasMoreRecommendations: false };
  }
  const cached = localStorage.getItem(STORAGE_KEY);
  if (!cached) {
      return {
        messages: [buildWelcomeMessage()],
        recommendations: [],
        criteriaMet: false,
        memory: {},
        hasMoreRecommendations: false,
      };
    }
  try {
    const parsed = JSON.parse(cached) as Partial<{
      messages: AiMessage[];
      recommendations: AiListing[];
      criteriaMet: boolean;
      memory: AiMemory;
      hasMoreRecommendations: boolean;
    }>;
  const messages =
      Array.isArray(parsed?.messages) && parsed.messages.length > 0 ? parsed.messages : [buildWelcomeMessage()];
    const recommendations = Array.isArray(parsed?.recommendations) ? parsed.recommendations : [];
    return {
      messages,
      recommendations,
      criteriaMet: Boolean(parsed?.criteriaMet),
      memory: parsed?.memory ?? {},
      hasMoreRecommendations: Boolean(parsed?.hasMoreRecommendations),
    };
  } catch (error) {
    console.error('Failed to parse cached AI Force messages', error);
  }
  return { messages: [buildWelcomeMessage()], recommendations: [], criteriaMet: false, memory: {}, hasMoreRecommendations: false };
};

const generateId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const useVinAiChat = create<VinAiState>((set, get) => ({
  messages: [],
  recommendations: [],
  criteriaMet: false,
  memory: {},
  initialized: false,
  isSending: false,
  isLoadingMore: false,
  hasMoreRecommendations: false,
  init: () => {
    if (get().initialized) return;
    const { messages, recommendations, criteriaMet, memory, hasMoreRecommendations } = loadState();
    set({ messages, recommendations, criteriaMet, memory, hasMoreRecommendations, initialized: true });
  },
  clear: () => {
    const resetMessages = [buildWelcomeMessage()];
     persistPayload({ messages: resetMessages, recommendations: [], criteriaMet: false, memory: {}, hasMoreRecommendations: false });
    set({ messages: resetMessages, recommendations: [], criteriaMet: false, memory: {}, hasMoreRecommendations: false });
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
    const optimisticMemory = get().memory;
    persistPayload({
      messages: optimisticMessages,
      recommendations: optimisticRecommendations,
      criteriaMet: optimisticCriteriaMet,
      memory: optimisticMemory,
      hasMoreRecommendations: get().hasMoreRecommendations,
    });
    set({
      messages: optimisticMessages,
      isSending: true,
      recommendations: optimisticRecommendations,
      criteriaMet: optimisticCriteriaMet,
      memory: optimisticMemory,
    });

    try {
      const res = await fetch('/api/vin-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: optimisticMessages.map(({ role, content }) => ({ role, content })),
          memory: optimisticMemory,
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
      const memory: AiMemory = (data?.memory ?? optimisticMemory) as AiMemory;
      const hasMoreRecommendations = Boolean(data?.hasMore);
      persistPayload({ messages: updatedMessages, recommendations: apiRecommendations, criteriaMet, memory, hasMoreRecommendations });
      set({ messages: updatedMessages, recommendations: apiRecommendations, criteriaMet, memory, hasMoreRecommendations });
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
        memory: optimisticMemory,
        hasMoreRecommendations: get().hasMoreRecommendations,
      });
      set({
        messages: updatedMessages,
        recommendations: optimisticRecommendations,
        criteriaMet: optimisticCriteriaMet,
        memory: optimisticMemory,
      });
    } finally {
      set({ isSending: false });
    }
  },
  loadMoreRecommendations: async () => {
    const { messages, memory, recommendations, criteriaMet, isLoadingMore, hasMoreRecommendations } = get();
    if (!criteriaMet || isLoadingMore || !hasMoreRecommendations) return;
    set({ isLoadingMore: true });
    try {
      const res = await fetch('/api/vin-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.map(({ role, content }) => ({ role, content })),
          memory,
          offset: recommendations.length,
          limit: 10,
          mode: 'recommendations',
        }),
      });
      const data = await res.json();
      const nextRecommendations = Array.isArray(data?.recommendations) ? data.recommendations : [];
      const merged = [...recommendations, ...nextRecommendations];
      const hasMoreRecommendations = Boolean(data?.hasMore);
      persistPayload({
        messages,
        recommendations: merged,
        criteriaMet,
        memory,
        hasMoreRecommendations,
      });
      set({
        recommendations: merged,
        hasMoreRecommendations,
      });
    } catch (error) {
      console.error('AI Force failed to load more listings', error);
    } finally {
      set({ isLoadingMore: false });
    }
  },
}));

export default useVinAiChat;
export { AI_FORCE_ASSISTANT };
// export type { AiMessage };