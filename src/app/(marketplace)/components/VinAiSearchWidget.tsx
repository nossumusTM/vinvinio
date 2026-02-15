'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LuLoader2, LuMaximize2, LuRocket, LuSkipForward, LuStar, LuX } from 'react-icons/lu';
import { RiSpaceShipFill } from 'react-icons/ri';
import { MdFullscreen } from "react-icons/md";
import { TbArrowElbowRight, TbPlayerPause, TbPlayerPlay, TbPlayerStopFilled } from 'react-icons/tb';
import { HiMiniMicrophone } from 'react-icons/hi2';
import clsx from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';
import { BiReset } from "react-icons/bi";

import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import toast from 'react-hot-toast';
import { Range } from 'react-date-range';

import useVinAiChat, { AI_FORCE_ASSISTANT, AiMessage } from '../hooks/useVinAiChat';
import type { AiListing } from '../hooks/useVinAiChat';
import useMessenger from '../hooks/useMessager';
import VinAiChatView from './VinAiChatView';
import { categories as experienceCategories } from './navbar/Categories';

import CountrySearchSelect, { type CountrySelectValue } from './inputs/CountrySearchSelect';
import Calendar from './inputs/Calendar';
import Counter from './inputs/Counter';

interface VinAiSearchWidgetProps {
  onSkip: () => void;
  onExpand?: () => void;
  isModalOpen?: boolean;
}

const quickPrompts = ['Where?', 'When?', 'Who?', 'Show listings'];

const uploadPreset = 'vinvinpreset';
const cloudName = 'dlomv0hbe';
const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;

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
        className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-blue-700 shadow-sm ring-1 ring-blue-100 transition hover:bg-blue-50"
        aria-label={isPlaying ? 'Pause voice note' : 'Play voice note'}
      >
        {isPlaying ? <TbPlayerPause size={16} /> : <TbPlayerPlay size={16} />}
      </button>
      <div className="flex-1 space-y-1">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white shadow-inner">
          <div
            className="h-full rounded-full bg-blue-500 transition-[width] duration-150"
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
        className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-blue-700 shadow-sm ring-1 ring-blue-100 transition hover:bg-blue-50"
        aria-label="Stop playback"
      >
        <TbPlayerStopFilled size={14} />
      </button>
      <audio ref={audioRef} className="hidden" preload="metadata">
        <source src={src} type="audio/webm" />
      </audio>
    </div>
  );
};

const TypingIndicator = () => (
  <div className="flex items-center gap-2">
    <span className="h-2 w-2 animate-bounce rounded-full bg-neutral-500/80 [animation-delay:-0.2s]" />
    <span className="h-2 w-2 animate-bounce rounded-full bg-neutral-500/80 [animation-delay:-0.1s]" />
    <span className="h-2 w-2 animate-bounce rounded-full bg-neutral-500/80" />
  </div>
);

const StatusIcon = ({ status }: { status: 'done' | 'todo' }) => {
  if (status === 'done') {
    return (
      <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#2200ffff] text-white">
        <svg viewBox="0 0 16 16" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3.5 8.5l2.5 2.5 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }

  return (
    <span className="flex h-3.5 w-3.5 aspect-square items-center justify-center rounded-full border border-neutral-300 bg-white">
      <span className="h-1 w-1 rounded-full bg-neutral-300" />
    </span>
  );
};

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
    <div className="whitespace-pre-line text-black/90 leading-relaxed">
      {displayed}
      {showCursor && (
        <span className="ml-1 inline-flex h-2 w-2 align-middle animate-pulse rounded-full bg-neutral-400" />
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
            <h2 key={`h2-${index}`} className="text-sm font-semibold text-neutral-900">
              {block.content as string}
            </h2>
          );
        }
        if (block.type === 'ul') {
          return (
            <ul key={`ul-${index}`} className="space-y-1 text-xs text-neutral-700">
              {(block.content as string[]).map((item, itemIndex) => {
                const match = item.match(/^\[(done|todo)\]\s*(.*)$/i);
                const status = match?.[1]?.toLowerCase() as 'done' | 'todo' | undefined;
                const label = match?.[2] ?? item;
                return (
                  <li key={`li-${index}-${itemIndex}`} className="flex gap-2">
                    {status ? <StatusIcon status={status} /> : <span>•</span>}
                    <span>{label}</span>
                  </li>
                );
              })}
            </ul>
          );
        }
        return (
          <p key={`p-${index}`} className="text-xs text-neutral-700">
            {block.content as string}
          </p>
        );
      })}
    </div>
  );
};

const VinAiSearchWidget = ({ onSkip, onExpand, isModalOpen }: VinAiSearchWidgetProps) => {
const {
    messages,
    recommendations,
    criteriaMet,
    memory,
    init,
    sendMessage,
    isSending,
    clear,
    loadMoreRecommendations,
    hasMoreRecommendations,
    isLoadingMore,
    listingsUnlocked,
    confirmedCriteriaKey,
    setListingsUnlocked,
  } = useVinAiChat();
  const { openChat } = useMessenger();
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSendingVoice, setIsSendingVoice] = useState(false);
  const [recordingStart, setRecordingStart] = useState<number | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [typedMessageIds, setTypedMessageIds] = useState<string[]>([]);
  const hasSeededTyping = useRef(false);
  const [isListening, setIsListening] = useState(false);
  const speechRecognitionRef = useRef<SpeechRecognition | null>(null);
  const [selectedListing, setSelectedListing] = useState<AiListing | null>(null);
  const [guidedLocation, setGuidedLocation] = useState<CountrySelectValue | null>(null);
  const [guidedIntent, setGuidedIntent] = useState('');
  const [guidedDateRange, setGuidedDateRange] = useState<Range>({
    startDate: new Date(),
    endDate: new Date(),
    key: 'selection',
  });
  const [guidedGuests, setGuidedGuests] = useState(1);
  const [guidedCategory, setGuidedCategory] = useState<string | null>(null);
  const [guidedTime, setGuidedTime] = useState<string | null>(null);
  const [guidedProgress, setGuidedProgress] = useState({
    location: false,
    intent: false,
    date: false,
    guests: false,
  });
  const [detailEdits, setDetailEdits] = useState({
    location: '',
    category: '',
    dates: '',
    guests: '',
  });
  const router = useRouter();

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTriggerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingActivatedRef = useRef(false);

  useEffect(() => {
    init();
  }, [init]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'auto') => {
    if (!bottomRef.current) return;
    requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ block: 'end', behavior }));
    setTimeout(() => bottomRef.current?.scrollIntoView({ block: 'end', behavior }), 50);
  }, []);

  useEffect(() => {
    if (!isModalOpen) return;
    scrollToBottom('smooth');
  }, [isModalOpen, scrollToBottom]);

  useEffect(() => {
    const hasMemory =
      Boolean(memory?.location) ||
      Boolean(memory?.category) ||
      Boolean(memory?.dateRange?.startDate) ||
      Boolean(memory?.guestCount);
    if (!hasMemory && messages.length <= 1) {
      setGuidedProgress({
        location: false,
        intent: false,
        date: false,
        guests: false,
      });
      setGuidedLocation(null);
      setGuidedIntent('');
      setGuidedDateRange({
        startDate: new Date(),
        endDate: new Date(),
        key: 'selection',
      });
      setGuidedGuests(1);
      setGuidedCategory(null);
      setGuidedTime(null);
    }
  }, [memory, messages.length]);

  useEffect(() => {
    setGuidedProgress((prev) => ({
      location: prev.location || Boolean(memory?.location),
      intent: prev.intent || Boolean(memory?.category),
      date: prev.date || Boolean(memory?.dateRange?.startDate),
      guests: prev.guests || Boolean(memory?.guestCount),
    }));
  }, [memory]);

  useEffect(() => {
    if (memory?.guestCount) {
      setGuidedGuests(memory.guestCount);
    }
  }, [memory?.guestCount]);

  useEffect(() => {
    if (memory?.category) {
      setGuidedCategory(memory.category);
    }
  }, [memory?.category]);

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

  const lastAssistantId = useMemo(
    () => [...messages].reverse().find((message) => message.role === 'assistant')?.id,
    [messages],
  );
  const isLatestAssistantTyped = !lastAssistantId || typedMessageIds.includes(lastAssistantId);

  const formattedDateRange = useMemo(() => {
    if (!memory?.dateRange?.startDate) return null;
    const start = memory.dateRange.startDate.slice(0, 10);
    const end = memory.dateRange.endDate?.slice(0, 10) ?? start;
    return start === end ? start : `${start} → ${end}`;
  }, [memory]);

  useEffect(() => {
    setDetailEdits({
      location: memory?.location ?? '',
      category: memory?.category ?? '',
      dates: formattedDateRange ?? '',
      guests: memory?.guestCount ? String(memory.guestCount) : '',
    });
  }, [memory?.category, memory?.guestCount, memory?.location, formattedDateRange]);

  const guidedStep = useMemo(() => {
    if (!guidedProgress.location) return 'location';
    if (!guidedProgress.intent) return 'intent';
    if (!guidedProgress.date) return 'date';
    if (!guidedProgress.guests) return 'guests';
    return 'done';
  }, [guidedProgress]);

  const guidedComplete = criteriaMet || guidedStep === 'done';

  const criteriaKey = useMemo(
    () =>
      JSON.stringify({
        location: memory?.location ?? null,
        category: memory?.category ?? null,
        dateRange: memory?.dateRange ?? null,
        guestCount: memory?.guestCount ?? null,
      }),
    [memory?.category, memory?.dateRange, memory?.guestCount, memory?.location],
  );

  useEffect(() => {
    if (!listingsUnlocked) return;
    if (!confirmedCriteriaKey) {
      setListingsUnlocked(true, criteriaKey);
      return;
    }
    if (criteriaKey !== confirmedCriteriaKey) {
      setListingsUnlocked(false);
    }
  }, [confirmedCriteriaKey, criteriaKey, listingsUnlocked, setListingsUnlocked]);

  const formatLocationLabel = (value: CountrySelectValue | null) => {
    if (!value) return '';
    return value.city ? `${value.city}, ${value.label}` : value.label;
  };

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
          setGuidedProgress((prev) => ({ ...prev, location: true }));
          await handleSend(label || `My location is ${coords.latitude}, ${coords.longitude}`);
        } catch (error) {
          console.error('Failed to fetch location label', error);
          setGuidedProgress((prev) => ({ ...prev, location: true }));
          await handleSend(`My location is ${coords.latitude}, ${coords.longitude}`);
        }
      },
      () => {
        toast.error('Unable to access your location.');
      },
    );
  };

  const uploadToCloudinary = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    if (!res.ok || !data?.secure_url) {
      throw new Error('Upload failed');
    }

    return data.secure_url as string;
  };

  const handleSend = async (value?: string) => {
    const messageToSend = (value ?? input).trim();
    if (!messageToSend) return;
    setInput('');
    setShowEmojiPicker(false);
    await sendMessage(messageToSend);
  };

  const handleGuidedLocationNext = useCallback(async () => {
    if (!guidedLocation) return;
    setGuidedProgress((prev) => ({ ...prev, location: true }));
    await handleSend(`My destination is ${formatLocationLabel(guidedLocation)}.`);
  }, [guidedLocation, formatLocationLabel]);

  const handleGuidedIntentNext = useCallback(async () => {
    const trimmed = guidedIntent.trim();
    const selectedCategory = guidedCategory?.trim();
    if (!trimmed && !selectedCategory) return;
    setGuidedProgress((prev) => ({ ...prev, intent: true }));
    const messageParts = [];
    if (trimmed) messageParts.push(`I'm looking for ${trimmed}.`);
    if (selectedCategory) messageParts.push(`Category: ${selectedCategory}.`);
    await handleSend(messageParts.join(' '));
  }, [guidedIntent, guidedCategory]);

  const handleGuidedDateNext = useCallback(async () => {
    if (!guidedDateRange?.startDate) return;
    const start = guidedDateRange.startDate.toLocaleDateString();
    const end = guidedDateRange.endDate?.toLocaleDateString() ?? start;
    setGuidedProgress((prev) => ({ ...prev, date: true }));
    const timeLabel = guidedTime ? ` at ${guidedTime}` : '';
    await handleSend(`Service dates: ${start}${end !== start ? ` to ${end}` : ''}${timeLabel}.`);
  }, [guidedDateRange, guidedTime]);

  const handleGuidedGuestsNext = useCallback(async () => {
    if (!guidedGuests) return;
    setGuidedProgress((prev) => ({ ...prev, guests: true }));
    await handleSend(`Guest count: ${guidedGuests}.`);
  }, [guidedGuests]);

  const handleEmojiSelect = (emoji: any) => {
    setInput((prev) => `${prev}${emoji?.native ?? emoji?.shortcodes ?? ''}`);
  };

  const startVoiceRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error('Voice recording is not supported on this device.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current = recorder;
      recordingActivatedRef.current = true;
      setIsRecording(true);
      setRecordingStart(Date.now());
      recorder.start();
    } catch (error) {
      console.error('Recording error:', error);
      toast.error('Unable to start voice recording.');
      recordingActivatedRef.current = false;
    }
  };

  const stopVoiceRecording = async () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || !recordingActivatedRef.current) return;

    setIsRecording(false);
    recordingActivatedRef.current = false;

    const stopped = new Promise<void>((resolve) => {
      recorder.onstop = () => {
        recorder.stream.getTracks().forEach((track) => track.stop());
        resolve();
      };
    });

    recorder.stop();
    await stopped;

    const durationMs = recordingStart ? Date.now() - recordingStart : 0;
    const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    audioChunksRef.current = [];

    if (blob.size === 0) return;

    if (blob.size > MAX_UPLOAD_SIZE) {
      toast.error('Voice note is too large (max 5MB).');
      return;
    }

    const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });

    setIsSendingVoice(true);
    try {
      const url = await uploadToCloudinary(file);
      await sendMessage('Voice message', { audioUrl: url, audioDurationMs: durationMs });
    } catch (error) {
      console.error('Failed to send voice message:', error);
      toast.error('Could not send voice message.');
    } finally {
      setIsSendingVoice(false);
    }
  };

  const scheduleRecording = () => {
    if (recordTriggerRef.current) clearTimeout(recordTriggerRef.current);
    recordTriggerRef.current = setTimeout(() => {
      startVoiceRecording();
    }, 350);
  };

  const cancelScheduledRecording = (shouldStop?: boolean) => {
    if (recordTriggerRef.current) {
      clearTimeout(recordTriggerRef.current);
      recordTriggerRef.current = null;
    }
    if (shouldStop && (isRecording || recordingActivatedRef.current)) {
      stopVoiceRecording();
    }
  };

  const startSpeechToText = () => {
    if (isListening || isRecording || isSending || isSendingVoice) return;
    const SpeechRecognition =
      (window as typeof window & { SpeechRecognition?: typeof window.SpeechRecognition })
        .SpeechRecognition ||
      (window as typeof window & { webkitSpeechRecognition?: typeof window.SpeechRecognition })
        .webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error('Voice to text is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = async (event) => {
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

  const handleDetailSubmit = async (field: keyof typeof detailEdits) => {
    const rawValue = detailEdits[field].trim();
    if (!rawValue) return;

    if (field === 'guests') {
      const count = Number(rawValue);
      if (!Number.isFinite(count) || count < 1) {
        toast.error('Please enter a valid guest count.');
        return;
      }
      if (memory?.guestCount && Number(memory.guestCount) === Math.floor(count)) return;
      await handleSend(`Guest count: ${Math.floor(count)}.`);
      return;
    }

    const labelMap: Record<Exclude<keyof typeof detailEdits, 'guests'>, string> = {
      location: 'Location',
      category: 'Category',
      dates: 'Service dates',
    };
    const currentValueMap: Record<Exclude<keyof typeof detailEdits, 'guests'>, string> = {
      location: memory?.location ?? '',
      category: memory?.category ?? '',
      dates: formattedDateRange ?? '',
    };

    if (rawValue === currentValueMap[field]) return;

    await handleSend(`${labelMap[field]}: ${rawValue}.`);
  };

  const renderMessageContent = (message: AiMessage) => {
    if (message.messageType === 'audio' && message.audioUrl) {
      return <AudioPlayer src={message.audioUrl} durationMs={message.audioDurationMs} />;
    }

    if (message.role === 'user') {
      return <div className="whitespace-pre-line text-white/90 leading-relaxed">{message.content}</div>;
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

  const guidedStepContent = useMemo(() => {
    const categoryOptions = experienceCategories.map((category) => category.label);
    if (guidedStep === 'location') {
      return (
        <div className="space-y-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">Step 1</p>
            <h3 className="text-xs font-semibold text-neutral-900">Choose a destination</h3>
            <p className="mt-1 text-[11px] text-neutral-500">Pick a city or country to start curating.</p>
          </div>
          <CountrySearchSelect value={guidedLocation} onChange={(value) => setGuidedLocation(value ?? null)} />
          <div className='flex flex-row gap-2'>
            <button
              type="button"
              onClick={handleUseLocation}
              className="w-full rounded-2xl border border-neutral-200 px-3 py-2 text-[11px] font-semibold text-neutral-700 shadow-sm transition hover:bg-neutral-50"
            >
              Position
            </button>
            <button
              type="button"
              onClick={handleGuidedLocationNext}
              className="w-full rounded-2xl bg-neutral-900 px-3 py-2 text-[11px] font-semibold text-white shadow-sm transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
              disabled={!guidedLocation}
            >
              Continue
            </button>
          </div>
        </div>
      );
    }

    if (guidedStep === 'intent') {
      return (
        <div className="space-y-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">Step 2</p>
            <h3 className="text-xs font-semibold text-neutral-900">What are you looking for?</h3>
            <p className="mt-1 text-[11px] text-neutral-500">Describe the activity vibe you want.</p>
            <p className="text-[11px] text-neutral-500">You can answer by text or voice.</p>
          </div>
          <input
            value={guidedIntent}
            onChange={(event) => setGuidedIntent(event.target.value)}
            placeholder="Food tours, hidden gems, art walks..."
            className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-[11px] shadow-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                handleGuidedIntentNext();
              }
            }}
          />
          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-neutral-700">Or just select a category</p>
            <div className="flex flex-wrap gap-2">
              {categoryOptions.map((category) => {
                const isSelected = guidedCategory === category;
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setGuidedCategory(isSelected ? null : category)}
                    className={clsx(
                      'rounded-full px-3 py-1 text-[10px] font-semibold transition',
                      isSelected
                        ? 'bg-neutral-900 text-white'
                        : 'border border-neutral-200 text-neutral-600 hover:border-neutral-400 hover:text-neutral-900',
                    )}
                  >
                    {category}
                  </button>
                );
              })}
            </div>
          </div>
          <button
            type="button"
            onClick={handleGuidedIntentNext}
            className="w-full rounded-full bg-neutral-900 px-3 py-2 text-[11px] font-semibold text-white shadow-sm transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
            disabled={!guidedIntent.trim() && !guidedCategory}
          >
            Continue
          </button>
        </div>
      );
    }

    if (guidedStep === 'date') {
      return (
        <div className="space-y-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">Step 3</p>
            <h3 className="text-xs font-semibold text-neutral-900">Select your service date</h3>
            <p className="mt-1 text-[11px] text-neutral-500">Choose the dates that fit your trip.</p>
          </div>
          <Calendar
            value={guidedDateRange}
            onChange={(value) => setGuidedDateRange(value.selection)}
            selectedTime={guidedTime}
            onTimeChange={(time) => setGuidedTime(time || null)}
            forceOpenTimes
          />
          <button
            type="button"
            onClick={handleGuidedDateNext}
            className="w-full rounded-full bg-neutral-900 px-3 py-2 text-[11px] font-semibold text-white shadow-sm transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
            disabled={!guidedDateRange?.startDate}
          >
            Continue
          </button>
        </div>
      );
    }

    if (guidedStep === 'guests') {
      return (
        <div className="space-y-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">Step 4</p>
            <h3 className="text-xs font-semibold text-neutral-900">How many people are traveling?</h3>
            <p className="mt-1 text-[11px] text-neutral-500">You can reply with just a number.</p>
          </div>
          <div className="rounded-2xl border border-neutral-100 bg-neutral-50 px-3 py-2">
            <Counter
              title="Guests"
              subtitle="Add guests"
              value={guidedGuests}
              onChange={(value) => setGuidedGuests(value)}
              enableManualInput
            />
          </div>
          <button
            type="button"
            onClick={handleGuidedGuestsNext}
            className="w-full rounded-full bg-neutral-900 px-3 py-2 text-[11px] font-semibold text-white shadow-sm transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300"
            disabled={guidedGuests < 1}
          >
            Show listings
          </button>
        </div>
      );
    }

    return null;
  }, [
    guidedStep,
    guidedLocation,
    guidedIntent,
    guidedCategory,
    guidedDateRange,
    guidedGuests,
    guidedTime,
    handleGuidedLocationNext,
    handleGuidedIntentNext,
    handleGuidedDateNext,
    handleGuidedGuestsNext,
    handleUseLocation,
  ]);

  return (
     <>
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="hidden md:flex flex items-center gap-2">
          <div className="flex h-9 w-9 aspect-square items-center justify-center rounded-xl bg-white text-[#2200ffff]">
            <RiSpaceShipFill className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-sm font-semibold text-neutral-900">Start with AI Vin</h2>
            <p className="text-xs text-neutral-500">Ask anything you need for.</p>
          </div>
        </div>
        <div className="pb-1 flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (onExpand) {
                onExpand();
                return;
              }
              setIsExpanded(true);
            }}
            className="flex items-center gap-1 rounded-full border border-neutral-200 px-3 py-1 text-xs font-semibold text-neutral-600 transition hover:bg-neutral-100"
          >
            Full
            <MdFullscreen className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={clear}
            className="rounded-xl border flex gap-1 items-center border-neutral-200 px-3 py-1 text-xs font-semibold text-neutral-600 transition hover:bg-neutral-100"
          >
            Reset
            <BiReset size={16}  />
          </button>
          <button
            type="button"
            onClick={onSkip}
            className="flex items-center gap-1 rounded-full border border-neutral-200 px-3 py-1 text-xs font-semibold text-neutral-600 transition hover:bg-neutral-100"
          >
            Skip
            <LuSkipForward className="h-4 w-4" />
          </button>
        </div>
        </div>
      </div>

       <div
        ref={scrollRef}
        className="
          space-y-3 overflow-y-auto rounded-2xl border border-neutral-100 bg-white/80 p-3 shadow-inner
          h-[calc(100dvh-260px)] max-h-[calc(80dvh-260px)]
          sm:h-auto sm:max-h-
        "
      >
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
              className={clsx(
                'flex gap-2 text-sm',
                message.role === 'user' ? 'flex-row-reverse text-right' : 'flex-row text-left'
              )}
            >
              <div
                className={clsx(
                  'inline-flex w-fit max-w-[78%] rounded-2xl px-3 py-2 text-[13px] shadow-sm',
                  message.role === 'user'
                    ? 'bg-neutral-900 text-white'
                    : 'bg-white text-neutral-900'
                )}
              >
                {renderMessageContent(message)}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {!guidedComplete && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className="rounded-2xl border border-neutral-100 bg-white px-3 py-3 text-sm shadow-sm"
          >
          {guidedStepContent}
          </motion.div>
        )}

        {isSending && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className="flex gap-2 text-sm"
          >
            <div className="inline-flex w-fit max-w-[78%] items-center rounded-2xl bg-neutral-100 px-3 py-2 shadow-sm">
              <TypingIndicator />
            </div>
          </motion.div>
        )}

        {criteriaMet && recommendations.length > 0 && isLatestAssistantTyped && !listingsUnlocked && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className="rounded-2xl border border-neutral-100 bg-white p-3 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-neutral-900">Confirm details</p>
                <p className="mt-1 text-xs text-neutral-500">Approve to see curated picks.</p>
              </div>
              <span className="rounded-full bg-neutral-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
                Ready
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-[11px] text-neutral-600">
              {memory.location && (
                <div className="rounded-2xl border border-sky-100 bg-sky-50/70 px-3 py-2 shadow-sm transition focus-within:border-sky-200 focus-within:ring-2 focus-within:ring-sky-100">
                  <p className="text-[10px] uppercase tracking-wide text-neutral-400">Location</p>
                  <input
                    value={detailEdits.location}
                    onChange={(event) => setDetailEdits((prev) => ({ ...prev, location: event.target.value }))}
                    onBlur={() => handleDetailSubmit('location')}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        handleDetailSubmit('location');
                      }
                    }}
                    inputMode="text"
                    className="mt-1 w-full bg-transparent text-xs font-semibold text-neutral-800 outline-none"
                  />
                </div>
              )}
              {memory.category && (
                <div className="rounded-2xl border border-sky-100 bg-sky-50/70 px-3 py-2 shadow-sm transition focus-within:border-sky-200 focus-within:ring-2 focus-within:ring-sky-100">
                  <p className="text-[10px] uppercase tracking-wide text-neutral-400">Category</p>
                  <input
                    value={detailEdits.category}
                    onChange={(event) => setDetailEdits((prev) => ({ ...prev, category: event.target.value }))}
                    onBlur={() => handleDetailSubmit('category')}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        handleDetailSubmit('category');
                      }
                    }}
                    inputMode="text"
                    className="mt-1 w-full bg-transparent text-xs font-semibold text-neutral-800 outline-none"
                  />
                </div>
              )}
              {formattedDateRange && (
                <div className="rounded-2xl border border-sky-100 bg-sky-50/70 px-3 py-2 shadow-sm transition focus-within:border-sky-200 focus-within:ring-2 focus-within:ring-sky-100">
                  <p className="text-[10px] uppercase tracking-wide text-neutral-400">Dates</p>
                  <input
                    value={detailEdits.dates}
                    onChange={(event) => setDetailEdits((prev) => ({ ...prev, dates: event.target.value }))}
                    onBlur={() => handleDetailSubmit('dates')}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        handleDetailSubmit('dates');
                      }
                    }}
                    inputMode="text"
                    className="mt-1 w-full bg-transparent text-xs font-semibold text-neutral-800 outline-none"
                  />
                </div>
              )}
              {memory.guestCount && (
                <div className="rounded-2xl border border-sky-100 bg-sky-50/70 px-3 py-2 shadow-sm transition focus-within:border-sky-200 focus-within:ring-2 focus-within:ring-sky-100">
                  <p className="text-[10px] uppercase tracking-wide text-neutral-400">Guests</p>
                  <input
                    value={detailEdits.guests}
                    onChange={(event) => setDetailEdits((prev) => ({ ...prev, guests: event.target.value }))}
                    onBlur={() => handleDetailSubmit('guests')}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        handleDetailSubmit('guests');
                      }
                    }}
                    inputMode="numeric"
                    type="number"
                    min={1}
                    className="mt-1 w-full bg-transparent text-xs font-semibold text-neutral-800 outline-none"
                  />
                </div>
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => clear()}
                className="flex-1 rounded-full border border-neutral-200 px-3 py-2 text-[11px] font-semibold text-neutral-600 transition hover:bg-neutral-100"
              >
                Reject
              </button>
              <button
                type="button"
                onClick={() => setListingsUnlocked(true, criteriaKey)}
                className="flex-1 rounded-full bg-neutral-900 px-3 py-2 text-[11px] font-semibold text-white shadow-sm transition hover:bg-neutral-800"
              >
                Accept & Show
              </button>
            </div>
          </motion.div>
        )}

        {criteriaMet && recommendations.length > 0 && isLatestAssistantTyped && listingsUnlocked && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className="rounded-2xl border border-neutral-100 bg-white p-3 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-neutral-700">
                Curated for you
                <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-500">
                  {recommendations.length} listings
                </span>
              </div>
              <button
                type="button"
                className="text-xs font-semibold text-neutral-600 underline-offset-2 hover:underline"
                onClick={() => handleSend('Show me more listings like these')}
              >
                Refresh
              </button>

              </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {recommendations.map((card, index) => (
                <motion.button
                  key={card.id}
                  type="button"
                  onClick={() => handleListingClick(card)}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                  whileHover={{ y: -3, scale: 0.98 }}
                  className="group relative overflow-hidden rounded-2xl border border-neutral-100 text-left shadow-sm"
                >
                  <div
                    className="absolute inset-0 bg-cover bg-center bg-black/55 bg-blend-multiply"
                    style={{ backgroundImage: `url(${card.image})` }}
                  />
                  <div className="relative flex h-full flex-col justify-between space-y-2 p-3 text-white">
                    <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide">
                      {card.badge || 'Featured'}
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-white/70">{card.category} · {card.location}</p>
                      <h4 className="text-base font-bold leading-tight">{card.title}</h4>
                      <p className="text-xs text-white/80">{card.description}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-[10px] text-white/80">
                      {/* {card.vinPoints !== undefined && <span>Vin {card.vinPoints}</span>} */}
                      {card.rating !== undefined && (
                        <span className="inline-flex items-center gap-1">
                          <LuStar className="h-3 w-3" /> {card.rating}
                        </span>
                      )}
                      {card.reviewCount !== undefined && <span>{card.reviewCount} reviews</span>}
                    </div>
                    <span className="text-[10px] font-semibold uppercase text-white/70">Tap for options</span>
                  </div>
                </motion.button>
              ))}
            </div>
            {hasMoreRecommendations && (
              <button
                type="button"
                onClick={loadMoreRecommendations}
                disabled={isLoadingMore}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-neutral-200 px-3 py-2 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:bg-neutral-100"
              >
                {isLoadingMore && <LuLoader2 className="h-4 w-4 animate-spin" />}
                Load more
              </button>
            )}
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex items-center justify-between text-[11px] text-neutral-500 px-1">
        <span className="font-medium text-neutral-700">Hold the send button to record a voice note.</span>
        {(isRecording || isSendingVoice || isSending) && (
          <span className="flex items-center gap-2 text-blue-600 font-semibold">
            {isRecording ? 'Recording…' : isSendingVoice ? 'Sending voice…' : 'Sending…'}
          </span>
        )}
      </div>

      {isRecording && (
        <div className="flex items-center gap-3 rounded-2xl border border-blue-200/70 bg-white/70 px-3 py-2 shadow-[0_0_25px_rgba(54,4,255,0.2)]">
          <div className="relative h-9 w-9">
            <span className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping" />
            <span className="absolute inset-1 rounded-full bg-blue-500/30 blur-sm" />
            <span className="absolute inset-2 flex items-center justify-center rounded-full bg-blue-600 text-white shadow-[0_0_16px_rgba(54,4,255,0.7)]">
              <HiMiniMicrophone size={16} />
            </span>
          </div>
          <div className="flex flex-col text-sm text-blue-800">
            <span className="font-semibold">Recording voice…</span>
            <span className="text-[11px] text-blue-700/80">Release to send your voice message.</span>

          </div>
        </div>
      )}

      {isSendingVoice && !isRecording && (
        <div className="text-xs text-blue-700 flex items-center gap-2 px-1">
          <HiMiniMicrophone className="animate-pulse" /> Uploading voice note…
        </div>
      )}

      {/* <div className="flex flex-wrap gap-2 text-xs text-neutral-600">
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
      </div> */}

      <div className="flex flex-row items-center gap-2">
        {/* <div className="relative">
          <button
            type="button"
            onClick={() => setShowEmojiPicker((prev) => !prev)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-neutral-600 shadow-sm ring-1 ring-neutral-200 transition hover:bg-neutral-100"
            aria-label="Emoji"
          >
            😎
          </button>
          {showEmojiPicker && (
            <div className="absolute bottom-12 left-0 z-50">
              <Picker data={data} onEmojiSelect={handleEmojiSelect} theme="light" previewPosition="none" />
            </div>
          )}
        </div> */}
        
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="What you want to do?"
          className="flex-1 rounded-2xl border border-neutral-200 bg-white px-3 text-baseline py-3 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          disabled={isRecording}
        />
        {/* <button
          type="button"
          onClick={startSpeechToText}
          className={clsx(
            'flex h-10 w-10 aspect-square items-center justify-center rounded-xl border border-neutral-200 text-neutral-600 shadow-sm transition hover:bg-neutral-100',
            isListening && 'border-blue-200 bg-blue-50 text-blue-700'
          )}
          aria-label="Voice to text"
          disabled={isRecording || isSending || isSendingVoice}
        >
          <HiMiniMicrophone className={clsx(isListening && 'animate-pulse')} size={16} />
        </button> */}
        <button
          type="button"
          onMouseDown={scheduleRecording}
          onMouseUp={() => cancelScheduledRecording(true)}
          onMouseLeave={() => cancelScheduledRecording(isRecording || recordingActivatedRef.current)}
          onTouchStart={scheduleRecording}
          onTouchEnd={() => cancelScheduledRecording(true)}
          onClick={() => {
            if (recordingActivatedRef.current || isRecording) return;
            handleSend();
          }}
          disabled={isSendingVoice || isSending}
                    className="flex h-10 w-10 aspect-square items-center justify-center rounded-xl bg-sky-50 text-sky-700 shadow-sm ring-1 ring-sky-100 transition hover:bg-sky-100 disabled:opacity-60"
          aria-label="Send or hold to record"
        >
          {isRecording ? <span className="text-lg">●</span> : <TbArrowElbowRight size={20} />}
        </button>
      </div>
    </div>

     <AnimatePresence>
        {isExpanded && !onExpand && (
          <>
            {/* Backdrop */}
            <motion.div
              key="vinai-fullscreen-backdrop"
              className="fixed inset-0 z-50 bg-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              onClick={() => setIsExpanded(false)}
            />

            {/* Panel container (like Messenger positioning rules) */}
            <motion.div
              key="vinai-fullscreen-shell"
              className="fixed inset-0 z-[51] flex items-end justify-center p-0 sm:p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
            >
              {/* The actual panel */}
              <motion.div
                key="vinai-fullscreen-panel"
                onClick={(e) => e.stopPropagation()}
                className="
                  pointer-events-auto w-full bg-white shadow-2xl overflow-hidden
                  min-h-[100dvh] sm:min-h-0
                  h-[100dvh] sm:h-full
                  rounded-none sm:rounded-3xl
                "
                // initial={{ y: 24, scale: 0.985, opacity: 0 }}
                // animate={{ y: 0, scale: 1, opacity: 1 }}
                // exit={{ y: 24, scale: 0.985, opacity: 0 }}
                // transition={{ type: 'spring', stiffness: 260, damping: 28 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <VinAiChatView
                  onBack={() => setIsExpanded(false)}
                  isFullscreen
                  onClose={() => setIsExpanded(false)}
                />
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedListing && (
          <motion.div
            className="rounded-3xl fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-0 sm:p-4"
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
                  className="flex aspect-square h-8 w-8 items-center justify-center rounded-full border border-neutral-200 text-neutral-500 transition hover:bg-neutral-100"
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
    </>
  );
};

export default VinAiSearchWidget;
