'use client';

import { create } from 'zustand';

export type AiRole = 'assistant' | 'user';

export interface AiMessage {
  id: string;
  role: AiRole;
  content: string;
  createdAt: string;
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
  sendMessage: (content: string) => Promise<void>;
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
  name: 'AI Force Assistant',
  image: undefined,
};

const AI_LISTINGS: AiListing[] = [
  {
    id: 'vin-wellness-1',
    title: 'Wellness retreat in Lake Como',
    category: 'wellness',
    location: 'Lake Como, Italy',
    badge: 'Spa + Chef',
    description: 'Sunrise yoga, chef’s table dinners, and lakeside hammam suites.',
    image: '/images/promo-banner-2.jpg',
  },
  {
    id: 'vin-adventure-1',
    title: 'Dolomites alpine escape',
    category: 'adventure',
    location: 'Cortina, Italy',
    badge: 'Guided Treks',
    description: 'Cable car panoramas, via ferrata thrills, and rustic chalets.',
    image: '/images/promo-banner-3.jpg',
  },
  {
    id: 'vin-city-1',
    title: 'Design loft near Duomo',
    category: 'city',
    location: 'Milan, Italy',
    badge: 'Late checkout',
    description: 'Gallery district loft with concierge, espresso bar, and balcony views.',
    image: '/images/promo-banner-1.jpg',
  },
  {
    id: 'vin-foodie-1',
    title: 'Chef-led food crawl',
    category: 'food',
    location: 'Bologna, Italy',
    badge: 'Tasting tour',
    description: 'Handmade pasta labs, balsamic attics, and private market access.',
    image: '/images/promo-banner.png',
  },
  {
    id: 'vin-romance-1',
    title: 'Canalside boutique stay',
    category: 'romance',
    location: 'Venice, Italy',
    badge: 'Gondola pickup',
    description: 'Candlelit lagoon nights with balcony breakfasts and opera concierge.',
    image: '/images/promo-banner-4.png',
  },
  {
    id: 'vin-family-1',
    title: 'Family beach club villa',
    category: 'family',
    location: 'Puglia, Italy',
    badge: 'Kids club',
    description: 'Private pool villa with kids’ atelier, bikes, and beach butler.',
    image: '/images/promo-banner-3.jpg',
  },
];

const deriveCategory = (content: string): string | undefined => {
  const normalized = content.toLowerCase();
  if (/(spa|wellness|relax|detox)/.test(normalized)) return 'wellness';
  if (/(hike|ski|mountain|adventure|trek)/.test(normalized)) return 'adventure';
  if (/(family|kids|group)/.test(normalized)) return 'family';
  if (/(romantic|honeymoon|couple|love)/.test(normalized)) return 'romance';
  if (/(food|dining|restaurant|tasting)/.test(normalized)) return 'food';
  if (/(art|museum|city|urban|design)/.test(normalized)) return 'city';
  return undefined;
};

const pickRecommendations = (prompt?: string): AiListing[] => {
  if (!prompt) return [];
  const category = deriveCategory(prompt);
  if (!category) return AI_LISTINGS.slice(0, 3);
  const matches = AI_LISTINGS.filter((item) => item.category === category);
  return matches.length > 0 ? matches : AI_LISTINGS.slice(0, 3);
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
    const recommendations = Array.isArray(parsed?.recommendations)
      ? parsed.recommendations
      : pickRecommendations(messages.find((m) => m.role === 'user')?.content);
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
  sendMessage: async (content: string) => {
    const trimmed = content.trim();
    if (!trimmed) return;

    const userMessage: AiMessage = {
      id: generateId(),
      role: 'user',
      content: trimmed,
      createdAt: new Date().toISOString(),
    };

    const optimisticMessages = [...get().messages, userMessage];
    const updatedRecommendations = pickRecommendations(userMessage.content);
    persistPayload({ messages: optimisticMessages, recommendations: updatedRecommendations });
    set({ messages: optimisticMessages, isSending: true, recommendations: updatedRecommendations });

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
      persistPayload({ messages: updatedMessages, recommendations: updatedRecommendations });
      set({ messages: updatedMessages, recommendations: updatedRecommendations });
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
      persistPayload({ messages: updatedMessages, recommendations: updatedRecommendations });
      set({ messages: updatedMessages, recommendations: updatedRecommendations });
    } finally {
      set({ isSending: false });
    }
  },
}));

export default useVinAiChat;
export { AI_FORCE_ASSISTANT };