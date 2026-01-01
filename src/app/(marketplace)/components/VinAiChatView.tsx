'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { LuArrowLeft, LuRocket, LuTrash2, LuX } from 'react-icons/lu';
import { useRouter } from 'next/navigation';
import { TbArrowElbowRight, TbPlayerPause, TbPlayerPlay, TbPlayerStopFilled } from 'react-icons/tb';
import { HiMiniMicrophone } from 'react-icons/hi2';
import clsx from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import toast from 'react-hot-toast';

import Avatar from './Avatar';
import useMessenger from '../hooks/useMessager';
import useVinAiChat, { AI_FORCE_ASSISTANT } from '../hooks/useVinAiChat';
import type { AiListing, AiMessage } from '../hooks/useVinAiChat';

interface VinAiChatViewProps {
  onBack: () => void;
  isFullscreen?: boolean;
  onClose?: () => void;
}

const quickPrompts = ['Where?', 'When?', 'Who?', 'Show listings'];

const formatSeconds = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.max(0, Math.floor(seconds % 60));
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const AudioPlayer: React.FC<{ src: string; durationMs?: number | null }> = ({ src, durationMs }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [metaDuration, setMetaDuration] = useState<number | null>(durationMs ? durationMs / 1000 : null);

  const totalDuration = useMemo(() => metaDuration ?? 0, [metaDuration]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      const pct = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
      setProgress(Number.isFinite(pct) ? pct : 0);
    };

    const handleLoaded = () => {
      if (Number.isFinite(audio.duration)) {
        setMetaDuration(audio.duration);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoaded);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoaded);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlayback = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    audio
      .play()
      .then(() => setIsPlaying(true))
      .catch(() => setIsPlaying(false));
  };

  const stopPlayback = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
  };

  return (
    <div className="flex w-full items-center gap-3 rounded-xl border border-sky-100 bg-sky-50/70 px-3 py-2 shadow-sm">
      <button
        type="button"
        onClick={togglePlayback}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-blue-700 shadow-sm ring-1 ring-blue-100 transition hover:bg-blue-50"
        aria-label={isPlaying ? 'Pause voice note' : 'Play voice note'}
      >
        {isPlaying ? <TbPlayerPause /> : <TbPlayerPlay />}
      </button>
      <div className="flex-1 space-y-1">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white shadow-inner">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400 transition-[width] duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] font-medium text-blue-700">
          <span>{formatSeconds(currentTime)}</span>
          <span>{totalDuration ? formatSeconds(totalDuration) : 'Voice note'}</span>
        </div>
      </div>
      <button
        type="button"
        onClick={stopPlayback}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-blue-700 shadow-sm ring-1 ring-blue-100 transition hover:bg-blue-50"
        aria-label="Stop playback"
      >
        <TbPlayerStopFilled size={16} />
      </button>
      <audio ref={audioRef} className="hidden" preload="metadata">
        <source src={src} type="audio/webm" />
      </audio>
    </div>
  );
};

const TypingIndicator = () => (
  <div className="flex items-center gap-2">
    <span className="h-2 w-2 animate-bounce rounded-full bg-white/70 [animation-delay:-0.2s]" />
    <span className="h-2 w-2 animate-bounce rounded-full bg-white/70 [animation-delay:-0.1s]" />
    <span className="h-2 w-2 animate-bounce rounded-full bg-white/70" />
  </div>
);

const TypewriterText = ({
  text,
  shouldAnimate,
  onComplete,
}: {
  text: string;
  shouldAnimate: boolean;
  onComplete: () => void;
}) => {
  const [displayed, setDisplayed] = useState(shouldAnimate ? '' : text);
  const onCompleteRef = useRef(onComplete);
  const showCursor = shouldAnimate && displayed.length < text.length;

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!shouldAnimate) {
      setDisplayed(text);
      return;
    }

    let index = 0;
    const interval = setInterval(() => {
      index += 1;
      setDisplayed(text.slice(0, index));
      if (index >= text.length) {
        clearInterval(interval);
        onCompleteRef.current();
      }
    }, 12);

    return () => clearInterval(interval);
  }, [text, shouldAnimate]);

  return (
    <div className="whitespace-pre-line leading-relaxed">
      {displayed}
      {showCursor && (
        <span className="ml-1 inline-flex h-2 w-2 align-middle animate-pulse rounded-full bg-white/70" />
      )}
    </div>
  );
};

const StructuredMessage = ({ text }: { text: string }) => {
  const lines = text.split('\n');
  const blocks: Array<{ type: 'h2' | 'p' | 'ul'; content: string | string[] }> = [];
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length) {
      blocks.push({ type: 'ul', content: listItems });
      listItems = [];
    }
  };

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList();
      return;
    }
    if (trimmed.startsWith('## ')) {
      flushList();
      blocks.push({ type: 'h2', content: trimmed.replace(/^##\s+/, '') });
      return;
    }
    if (trimmed.startsWith('• ')) {
      listItems.push(trimmed.replace(/^•\s+/, ''));
      return;
    }
    flushList();
    blocks.push({ type: 'p', content: trimmed });
  });

  flushList();

  return (
    <div className="space-y-2">
      {blocks.map((block, index) => {
        if (block.type === 'h2') {
          return (
            <h2 key={`h2-${index}`} className="text-base font-semibold text-black/95 tracking-tight">
              {block.content as string}
            </h2>
          );
        }
        if (block.type === 'ul') {
          return (
            <ul key={`ul-${index}`} className="space-y-1 text-sm text-black/90">
              {(block.content as string[]).map((item, itemIndex) => (
                <li key={`li-${index}-${itemIndex}`} className="flex gap-2">
                  <span>•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={`p-${index}`} className="text-sm text-black/90">
            {block.content as string}
          </p>
        );
      })}
    </div>
  );
};

const VinAiChatView = ({ onBack, isFullscreen = false, onClose }: VinAiChatViewProps) => {
  const { messages, recommendations, criteriaMet, memory, init, sendMessage, isSending, clear } = useVinAiChat();
  const { openChat } = useMessenger();
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [typedMessageIds, setTypedMessageIds] = useState<string[]>([]);
  const [listingsUnlocked, setListingsUnlocked] = useState(false);
  const [selectedListing, setSelectedListing] = useState<AiListing | null>(null);
  const hasSeededTyping = useRef(false);
  const speechRecognitionRef = useRef<SpeechRecognition | null>(null);
  const router = useRouter();

  const scrollRef = useRef<HTMLDivElement | null>(null);
  
  const recordTriggerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [messages.length, recommendations.length, isSending]);

  useEffect(() => {
    if (!messages.length) return;
    if (!hasSeededTyping.current) {
      setTypedMessageIds(messages.filter((message) => message.role === 'assistant').map((message) => message.id));
      hasSeededTyping.current = true;
      return;
    }
    if (messages.length <= 1) {
      setTypedMessageIds(messages.filter((message) => message.role === 'assistant').map((message) => message.id));
    }
  }, [messages]);

  const lastUpdated = useMemo(() => messages[messages.length - 1]?.createdAt, [messages]);

  const lastAssistantId = useMemo(
    () => [...messages].reverse().find((message) => message.role === 'assistant')?.id,
    [messages],
  );
  const isLatestAssistantTyped = !lastAssistantId || typedMessageIds.includes(lastAssistantId);
  const hasUserMessage = useMemo(
    () => messages.some((message) => message.role === 'user'),
    [messages],
  );

  useEffect(() => {
    setListingsUnlocked(false);
  }, [criteriaMet, memory, recommendations.length]);

  const formattedDateRange = useMemo(() => {
    if (!memory?.dateRange?.startDate) return null;
    const start = memory.dateRange.startDate.slice(0, 10);
    const end = memory.dateRange.endDate?.slice(0, 10) ?? start;
    return start === end ? start : `${start} → ${end}`;
  }, [memory]);

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported on this device.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords.latitude}&lon=${coords.longitude}`,
          );
          const data = await res.json();
          const address = data?.address ?? {};
          const label = [
            address.city || address.town || address.village || address.state,
            address.country,
          ]
            .filter(Boolean)
            .join(', ');
          await handleSend(label || `My location is ${coords.latitude}, ${coords.longitude}`);
        } catch (error) {
          console.error('Failed to fetch location label', error);
          await handleSend(`My location is ${coords.latitude}, ${coords.longitude}`);
        }
      },
      () => {
        toast.error('Unable to access your location.');
      },
    );
  };

  const handleSend = async (value?: string) => {
    const messageToSend = (value ?? input).trim();
    if (!messageToSend) return;
    setInput('');
    setShowEmojiPicker(false);
    await sendMessage(messageToSend);
  };

  const handleEmojiSelect = (emoji: unknown) => {
    const e = emoji as { native?: string; shortcodes?: string };
    setInput((prev) => `${prev}${e?.native ?? e?.shortcodes ?? ''}`);
  };

  const scheduleSpeechToText = () => {
    if (recordTriggerRef.current) clearTimeout(recordTriggerRef.current);
    recordTriggerRef.current = setTimeout(() => {
      startSpeechToText();
    }, 350);
  };

  const cancelScheduledSpeechToText = (shouldStop?: boolean) => {
    if (recordTriggerRef.current) {
      clearTimeout(recordTriggerRef.current);
      recordTriggerRef.current = null;
    }
    if (shouldStop && isListening) {
      stopSpeechToText();
    }
  };

  const startSpeechToText = () => {
    if (isListening || isSending) return;
    const SpeechRecognitionCtor =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      toast.error('Voice to text is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = async (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? '')
        .join(' ')
        .trim();
      if (transcript) {
        setInput('');
        await sendMessage(transcript);
      } else {
        toast.error('I could not detect any speech. Please try again.');
      }
    };

    recognition.onerror = () => {
      toast.error('Voice to text failed. Please try again.');
    };

    recognition.onend = () => {
      setIsListening(false);
      speechRecognitionRef.current = null;
    };

    speechRecognitionRef.current = recognition;
    setIsListening(true);
    recognition.start();
  };

  const stopSpeechToText = () => {
    const recognition = speechRecognitionRef.current;
    if (!recognition) return;
    recognition.stop();
  };

  const handleListingClick = (listing: AiListing) => {
    setSelectedListing(listing);
  };

  const handleListingAction = (action: 'ask' | 'navigate') => {
    if (!selectedListing) return;
    if (action === 'ask') {
      openChat(AI_FORCE_ASSISTANT);
      handleSend(`Show me more about ${selectedListing.title}`);
    } else {
      const target = selectedListing.slug ? `/listings/${selectedListing.slug}` : `/listings/${selectedListing.id}`;
      router.push(target);
    }
    setSelectedListing(null);
  };

  const handleQuickPrompt = (value: string) => {
    handleSend(value);
  };

  const renderMessageContent = (message: AiMessage) => {
    if (message.messageType === 'audio' && message.audioUrl) {
      return <AudioPlayer src={message.audioUrl} durationMs={message.audioDurationMs} />;
    }

  if (message.role === 'user') {
      return <div className="whitespace-pre-line leading-relaxed">{message.content}</div>;
    }

    const shouldAnimate =
      message.role === 'assistant' &&
      message.id === lastAssistantId &&
      !typedMessageIds.includes(message.id);

    if (shouldAnimate) {
      return (
        <TypewriterText
          text={message.content}
          shouldAnimate={shouldAnimate}
          onComplete={() =>
            setTypedMessageIds((prev) => (prev.includes(message.id) ? prev : [...prev, message.id]))
          }
        />
      );
    }

    return <StructuredMessage text={message.content} />;
  };

  return (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className={clsx(
          'flex flex-col overflow-hidden',
          isFullscreen ? 'h-full w-full' : 'h-[66vh] max-h-[80vh]',
        )}
    >
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
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-900 text-white">
            <LuRocket className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold">AI Force</span>
            {/* <span className="text-xs text-neutral-500">Powered by TanStack AI + ChatGPT</span> */}
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
          </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 text-neutral-500 transition hover:border-neutral-300 hover:bg-neutral-50"
                aria-label="Close"
              >
                <LuX className="h-4 w-4" />
              </button>
            )}
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 min-h-0 space-y-4 overflow-y-auto bg-neutral-50 px-4 py-5"
        >
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
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-900 text-white">
                    <LuRocket className="h-5 w-5" />
                  </div>
                )}
                <div
                  className={clsx(
                    'inline-flex w-fit max-w-[78%] flex-col rounded-2xl px-4 py-3 text-[15px] shadow-sm backdrop-blur',
                    isUser
                      ? 'bg-white text-neutral-800 ring-1 ring-neutral-100'
                      : isFullscreen
                      ? 'bg-sky-50 text-neutral-900'
                      : 'bg-sky-50 text-white shadow-[0_12px_32px_rgba(15,23,42,0.3)]'
                  )}
                >
                  {renderMessageContent(message)}
                <div
                    className={clsx(
                      'mt-2 text-[11px]',
                      isUser ? 'text-neutral-400' : isFullscreen ? 'text-neutral-500' : 'text-neutral-300'
                    )}
                  >
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

        {!hasUserMessage && (
          <motion.div
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="flex gap-3 text-left"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-900 text-white">
              <LuRocket className="h-5 w-5" />
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
              <p className="text-sm font-semibold text-neutral-800">Share your location</p>
              <p className="mt-1 text-xs text-neutral-500">
                Tell me your country or region, or let me use your device location.
              </p>
              <button
                type="button"
                onClick={handleUseLocation}
                className="mt-3 inline-flex items-center gap-2 rounded-full bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-neutral-800"
              >
                Use my location
              </button>
            </div>
          </motion.div>
        )}

        {isSending && (
          <motion.div
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="flex gap-3 text-left"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-900 text-white">
              <LuRocket className="h-5 w-5" />
            </div>
            <div className="inline-flex w-fit max-w-[78%] items-center rounded-2xl bg-neutral-900 px-4 py-3 text-sm text-white shadow-[0_10px_30px_rgba(15,23,42,0.25)]">
              <TypingIndicator />
            </div>
          </motion.div>
        )}

        {criteriaMet && recommendations.length > 0 && isLatestAssistantTyped && !listingsUnlocked && (
          <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="flex gap-3 text-left"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-900 text-white">
              <LuRocket className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1 rounded-2xl bg-white px-4 py-4 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-neutral-900">Confirm details</p>
                  <p className="mt-1 text-xs text-neutral-500">Approve to surface the top matches.</p>
                </div>
                <span className="rounded-full bg-neutral-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                  Ready
                </span>
              </div>
              <div className="mt-3 grid gap-2 text-xs text-neutral-600 sm:grid-cols-2">
                {memory.location && (
                  <div className="rounded-xl bg-neutral-50 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-wide text-neutral-400">Location</p>
                    <p className="font-semibold text-neutral-800">{memory.location}</p>
                  </div>
                )}
                {memory.category && (
                  <div className="rounded-xl bg-neutral-50 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-wide text-neutral-400">Category</p>
                    <p className="font-semibold text-neutral-800">{memory.category}</p>
                  </div>
                )}
                {formattedDateRange && (
                  <div className="rounded-xl bg-neutral-50 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-wide text-neutral-400">Dates</p>
                    <p className="font-semibold text-neutral-800">{formattedDateRange}</p>
                  </div>
                )}
                {memory.guestCount && (
                  <div className="rounded-xl bg-neutral-50 px-3 py-2">
                    <p className="text-[10px] uppercase tracking-wide text-neutral-400">Guests</p>
                    <p className="font-semibold text-neutral-800">{memory.guestCount}</p>
                  </div>
                )}
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => clear()}
                  className="flex-1 rounded-full border border-neutral-200 px-4 py-2 text-xs font-semibold text-neutral-600 transition hover:bg-neutral-100"
                >
                  Reject
                </button>
                <button
                  type="button"
                  onClick={() => setListingsUnlocked(true)}
                  className="flex-1 rounded-full bg-neutral-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-neutral-800"
                >
                  Accept & Show
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {criteriaMet && recommendations.length > 0 && isLatestAssistantTyped && listingsUnlocked && (
          <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="flex gap-3 text-left"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-900 text-white">
              <LuRocket className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1 space-y-3 rounded-2xl bg-white px-4 py-3 shadow-sm">
              <div className="flex items-center justify-between gap-3">
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
                {recommendations.map((card, index) => (
                  <motion.button
                    key={card.id}
                    type="button"
                    onClick={() => handleListingClick(card)}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2, delay: index * 0.04 }}
                    whileHover={{ y: -4, scale: 1.01 }}
                    className="group relative min-w-[240px] max-w-[260px] overflow-hidden rounded-2xl border border-neutral-100 text-left shadow-sm"
                  >
                    <div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{
                        backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.65) 70%), url(${card.image})`,
                      }}
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
                        <span>Tap for options</span>
                        <span className="rounded-full bg-white/20 px-2 py-1 text-[10px] font-semibold uppercase">AI pick</span>
                      </div>
                      
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <div className="space-y-4 border-t bg-white px-4 py-3 shadow-inner">
        <div className="flex items-center justify-between text-[11px] text-neutral-500 px-1">
          <span className="font-medium text-neutral-700">Hold the send button to speak (speech-to-text).</span>
          {(isListening || isSending) && (
            <span className="flex items-center gap-2 text-blue-600 font-semibold">
              {isListening ? 'Listening…' : 'Sending…'}
            </span>
          )}
        </div>

        {isListening && (
          <div className="flex items-center gap-3 rounded-2xl border border-blue-200/70 bg-white/70 px-3 py-2 shadow-[0_0_25px_rgba(54,4,255,0.2)]">
            <div className="relative h-10 w-10">
              <span className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping" />
              <span className="absolute inset-1 rounded-full bg-blue-500/30 blur-sm" />
              <span className="absolute inset-2 flex items-center justify-center rounded-full bg-blue-600 text-white shadow-[0_0_16px_rgba(54,4,255,0.7)]">
                <HiMiniMicrophone />
              </span>
            </div>
            <div className="flex flex-col text-sm text-blue-800">
              <span className="font-semibold">Listening…</span>
              <span className="text-[11px] text-blue-700/80">Release to send your message.</span>
            </div>
          </div>
        )}

        {/* <div className="flex flex-wrap gap-2 text-xs text-neutral-600">
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
        </div> */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex w-full items-center gap-3 pb-0 md:pb-3"
        >
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowEmojiPicker((prev) => !prev)}
              className="text-neutral-600 hover:text-yellow-500 transition"
              aria-label="Add emoji"
            >
              😎
            </button>
            {showEmojiPicker && (
              <div className="absolute bottom-12 left-0 z-50">
                <Picker data={data} onEmojiSelect={handleEmojiSelect} theme="light" previewPosition="none" />
              </div>
            )}
          </div>

          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask AI Force to find listings or guide you."
            className="flex-1 rounded-xl border border-neutral-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={isListening}
          />
          {/* <button
            type="button"
            onClick={startSpeechToText}
            className={clsx(
              'flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 text-neutral-600 transition hover:border-neutral-300 hover:bg-neutral-100',
              isListening && 'border-blue-200 bg-blue-50 text-blue-700'
            )}
            aria-label="Voice to text"
            disabled={isRecording || isSending || isSendingVoice}
          >
            <HiMiniMicrophone className={clsx(isListening && 'animate-pulse')} />
          </button> */}
          <button
            type="button"
            onMouseDown={scheduleSpeechToText}
            onMouseUp={() => cancelScheduledSpeechToText(true)}
            onMouseLeave={() => cancelScheduledSpeechToText(isListening)}
            onTouchStart={scheduleSpeechToText}
            onTouchEnd={() => cancelScheduledSpeechToText(true)}
            onClick={() => {
              if (isListening) return;
              handleSend();
            }}
            className={clsx(
              'flex h-10 w-10 items-center justify-center rounded-full transition shadow-sm',
              isListening
                ? 'bg-blue-600 text-white shadow-[0_0_18px_rgba(54,4,255,0.5)]'
                : 'bg-sky-50 text-sky-700 ring-1 ring-sky-100 hover:bg-sky-100'
            )}
            aria-label="Send or hold to record"
            disabled={isSending}
          >
            {isListening ? <span className="text-lg">●</span> : <TbArrowElbowRight size={20} />}
          </button>
        </form>
      </div>
       <AnimatePresence>
        {selectedListing && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-neutral-900">Choose an action</p>
                  <p className="mt-1 text-xs text-neutral-500">{selectedListing.title}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedListing(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 text-neutral-500 transition hover:bg-neutral-100"
                  aria-label="Close"
                >
                  <LuX className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-4 space-y-2">
                <button
                  type="button"
                  onClick={() => handleListingAction('ask')}
                  className="w-full rounded-2xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-neutral-800"
                >
                  Ask AI Force
                </button>
                <button
                  type="button"
                  onClick={() => handleListingAction('navigate')}
                  className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-100"
                >
                  View listing
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default VinAiChatView;