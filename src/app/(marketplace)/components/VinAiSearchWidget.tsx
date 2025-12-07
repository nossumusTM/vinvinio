'use client';

import { useEffect, useRef, useState } from 'react';
import { LuMic, LuPaperclip, LuRocket, LuSkipForward, LuSmile } from 'react-icons/lu';
import clsx from 'clsx';

import useVinAiChat, { AI_FORCE_ASSISTANT } from '../hooks/useVinAiChat';
import useMessenger from '../hooks/useMessager';

interface VinAiSearchWidgetProps {
  onSkip: () => void;
}

const quickPrompts = ['Where?', 'When?', 'Who?', 'Show listings'];

const VinAiSearchWidget = ({ onSkip }: VinAiSearchWidgetProps) => {
  const { messages, recommendations, init, sendMessage, isSending, clear } = useVinAiChat();
  const { openChat } = useMessenger();
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [messages.length, isSending]);

  const handleSend = async (value?: string) => {
    const messageToSend = (value ?? input).trim();
    if (!messageToSend) return;
    setInput('');
    await sendMessage(messageToSend);
  };

  const handleVoice = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) {
      setInput((prev) => `${prev} 🎤 Voice note ready. Share what you want.`);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.continuous = false;
    setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript;
      if (transcript) setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.start();
  };

  const handleAttachment = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setInput((prev) => (prev ? `${prev} [attached: ${file.name}]` : `[attached: ${file.name}]`));
  };

  const handleListingClick = (title: string) => {
    openChat(AI_FORCE_ASSISTANT);
    handleSend(`Show me more about ${title}`);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-50 via-indigo-50 to-white text-[#2200ffff]">
            <LuRocket className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">Start with AI Force</span>
            <span className="text-xs text-neutral-500">Ask anything before choosing where, when, and who.</span>
          </div>
        </div>
        <button
          type="button"
          onClick={onSkip}
          className="flex items-center gap-1 rounded-full border border-neutral-200 px-3 py-1 text-xs font-semibold text-neutral-600 transition hover:bg-neutral-100"
        >
          Skip
          <LuSkipForward className="h-4 w-4" />
        </button>
      </div>

      <div ref={scrollRef} className="max-h-64 space-y-3 overflow-y-auto rounded-2xl border border-neutral-100 bg-white/80 p-3 shadow-inner">
        {messages.map((message) => (
          <div
            key={message.id}
            className={clsx(
              'flex gap-2 text-sm',
              message.role === 'user' ? 'flex-row-reverse text-right' : 'flex-row text-left'
            )}
          >
            <div
              className={clsx(
                'rounded-2xl px-3 py-2 shadow-sm',
                message.role === 'user'
                  ? 'bg-neutral-900 text-white'
                  : 'bg-neutral-100 text-neutral-800'
              )}
            >
              <div className="whitespace-pre-line leading-relaxed">{message.content}</div>
            </div>
          </div>
        ))}
      </div>

      {recommendations.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">AI picks</div>
            <button
              type="button"
              className="text-xs font-semibold text-neutral-600 underline-offset-2 hover:underline"
              onClick={() => handleSend('Show me more listings like these')}
            >
              Refresh
            </button>
          </div>
          <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
            {recommendations.map((card) => (
              <button
                key={card.id}
                type="button"
                onClick={() => handleListingClick(card.title)}
                className="group relative min-w-[220px] max-w-[240px] overflow-hidden rounded-2xl border border-neutral-100 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.65) 70%), url(${card.image})` }}
                />
                <div className="relative flex h-full flex-col justify-between space-y-2 p-3 text-white">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide">
                    {card.badge || 'Featured'}
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-white/70">{card.category} · {card.location}</p>
                    <h4 className="text-base font-bold leading-tight">{card.title}</h4>
                    <p className="text-xs text-white/80">{card.description}</p>
                  </div>
                  <span className="text-[10px] font-semibold uppercase text-white/70">Tap to ask AI Force</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 text-xs text-neutral-600">
        {quickPrompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => handleSend(prompt)}
            className="rounded-full bg-neutral-100 px-3 py-1 font-semibold text-neutral-700 transition hover:bg-neutral-900 hover:text-white"
          >
            {prompt}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-neutral-600 shadow-sm ring-1 ring-neutral-200 transition hover:bg-neutral-100"
          aria-label="Attach"
        >
          <LuPaperclip className="h-5 w-5" />
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleAttachment}
            className="hidden"
            aria-hidden
          />
        </button>
        <button
          type="button"
          onClick={() => handleVoice()}
          className={clsx(
            'flex h-10 w-10 items-center justify-center rounded-full bg-white text-neutral-600 shadow-sm ring-1 ring-neutral-200 transition hover:bg-neutral-100',
            isListening && 'animate-pulse text-neutral-900'
          )}
          aria-label="Voice input"
        >
          <LuMic className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => setInput((prev) => `${prev} ✨`)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-neutral-600 shadow-sm ring-1 ring-neutral-200 transition hover:bg-neutral-100"
          aria-label="Emoji"
        >
          <LuSmile className="h-5 w-5" />
        </button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Tell AI Force what you want to explore or book."
          className="flex-1 rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <button
          type="button"
          onClick={() => handleSend()}
          disabled={isSending}
          className="rounded-2xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800 disabled:opacity-50"
        >
          {isSending ? 'Thinking...' : 'Send'}
        </button>
        <button
          type="button"
          onClick={clear}
          className="rounded-2xl border border-neutral-200 px-3 py-3 text-xs font-semibold text-neutral-600 transition hover:bg-neutral-100"
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default VinAiSearchWidget;