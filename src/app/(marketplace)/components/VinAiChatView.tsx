'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { LuArrowLeft, LuMic, LuPaperclip, LuRocket, LuSmile, LuTrash2 } from 'react-icons/lu';
import clsx from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';

import Avatar from './Avatar';
import useMessenger from '../hooks/useMessager';
import useVinAiChat, { AI_FORCE_ASSISTANT } from '../hooks/useVinAiChat';

interface VinAiChatViewProps {
  onBack: () => void;
}

const quickPrompts = ['Where?', 'When?', 'Who?', 'Show listings'];

const VinAiChatView = ({ onBack }: VinAiChatViewProps) => {
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

  const lastUpdated = useMemo(() => messages[messages.length - 1]?.createdAt, [messages]);

  const handleSend = async (value?: string) => {
    const messageToSend = (value ?? input).trim();
    if (!messageToSend) return;
    setInput('');
    await sendMessage(messageToSend);
  };

  const handleEmoji = (emoji: string) => setInput((prev) => `${prev}${emoji}`);

  const handleVoice = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) {
      setInput((prev) => `${prev} 🎤 Voice note ready. Tell me what to search for.`);
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

  const handleQuickPrompt = (value: string) => {
    handleSend(value);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <button
          type="button"
          onClick={onBack}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-100"
          aria-label="Back"
        >
          <LuArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-900 text-white">
            <LuRocket className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold">AI Force Assistant</span>
            <span className="text-xs text-neutral-500">Powered by TanStack AI + ChatGPT</span>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-3 text-xs text-neutral-500">
          {lastUpdated && <span>Updated {new Date(lastUpdated).toLocaleTimeString()}</span>}
          <button
            type="button"
            onClick={clear}
            className="flex items-center gap-1 rounded-full border border-neutral-200 px-3 py-1 font-medium text-neutral-600 shadow-sm transition hover:border-neutral-300 hover:bg-neutral-50"
          >
            <LuTrash2 className="h-4 w-4" />
            Clear
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto bg-neutral-50 px-4 py-5">
        <AnimatePresence>
          {messages.map((message) => {
            const isUser = message.role === 'user';
            return (
              <motion.div
                key={message.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                className={clsx('flex gap-3', isUser ? 'flex-row-reverse text-right' : 'flex-row text-left')}
              >
                {isUser ? (
                  <Avatar name="You" size={40} />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-900 text-white">
                    <LuRocket className="h-5 w-5" />
                  </div>
                )}
                <div
                  className={clsx(
                    'max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow-sm backdrop-blur',
                    isUser ? 'bg-white text-neutral-800' : 'bg-neutral-900 text-white'
                  )}
                >
                  <div className="whitespace-pre-line leading-relaxed">{message.content}</div>
                  <div className={clsx('mt-2 text-[11px]', isUser ? 'text-neutral-400' : 'text-neutral-300')}>
                    {new Date(message.createdAt).toLocaleString(undefined, {
                      hour: '2-digit',
                      minute: '2-digit',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="space-y-4 border-t bg-white p-4 shadow-inner">
        {recommendations.length > 0 && (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-neutral-700">
                Curated for you
                <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-500">Swipe</span>
              </div>
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
                  className="group relative min-w-[240px] max-w-[260px] overflow-hidden rounded-2xl border border-neutral-100 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.65) 70%), url(${card.image})` }}
                  />
                  <div className="relative flex h-full flex-col justify-between space-y-3 p-4 text-white">
                    <div className="space-y-2">
                      <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide">
                        {card.badge || 'Featured'}
                      </div>
                      <div className="text-sm font-semibold text-white/70">{card.category} · {card.location}</div>
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-lg font-bold leading-tight">{card.title}</h4>
                      <p className="text-sm text-white/80">{card.description}</p>
                    </div>
                    <div className="flex items-center justify-between text-xs text-white/80">
                      <span>Tap to ask AI Force</span>
                      <span className="rounded-full bg-white/20 px-2 py-1 text-[10px] font-semibold uppercase">AI pick</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        <div className="flex flex-wrap gap-2 text-xs text-neutral-600">
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => handleQuickPrompt(prompt)}
              className="rounded-full bg-neutral-100 px-3 py-1 font-semibold text-neutral-700 transition hover:bg-neutral-900 hover:text-white"
            >
              {prompt}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-3 py-2 shadow-sm">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-600 transition hover:bg-neutral-100"
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
            onClick={() => handleEmoji('✨')}
            className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-600 transition hover:bg-neutral-100"
            aria-label="Emoji"
          >
            <LuSmile className="h-5 w-5" />
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask AI Force to find listings or guide you."
            className="flex-1 rounded-xl px-3 py-2 text-sm focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <button
            type="button"
            onClick={handleVoice}
            className={clsx(
              'flex h-9 w-9 items-center justify-center rounded-full text-neutral-600 transition hover:bg-neutral-100',
              isListening && 'animate-pulse text-neutral-900'
            )}
            aria-label="Voice input"
          >
            <LuMic className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => handleSend()}
            disabled={isSending}
            className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800 disabled:opacity-50"
          >
            {isSending ? 'Thinking...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VinAiChatView;