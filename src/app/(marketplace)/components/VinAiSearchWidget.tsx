'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { LuRocket, LuSkipForward } from 'react-icons/lu';
import { TbArrowElbowRight, TbPlayerPause, TbPlayerPlay, TbPlayerStopFilled } from 'react-icons/tb';
import { HiMiniMicrophone } from 'react-icons/hi2';
import clsx from 'clsx';

import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import toast from 'react-hot-toast';

import useVinAiChat, { AI_FORCE_ASSISTANT, AiMessage } from '../hooks/useVinAiChat';
import useMessenger from '../hooks/useMessager';

interface VinAiSearchWidgetProps {
  onSkip: () => void;
}

const quickPrompts = ['Where?', 'When?', 'Who?', 'Show listings'];

const uploadPreset = 'vuolapreset';
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

const VinAiSearchWidget = ({ onSkip }: VinAiSearchWidgetProps) => {
  const { messages, recommendations, init, sendMessage, isSending, clear } = useVinAiChat();
  const { openChat } = useMessenger();
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSendingVoice, setIsSendingVoice] = useState(false);
  const [recordingStart, setRecordingStart] = useState<number | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTriggerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingActivatedRef = useRef(false);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [messages.length, recommendations.length, isSending]);

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

  const handleListingClick = (title: string) => {
    openChat(AI_FORCE_ASSISTANT);
    handleSend(`Show me more about ${title}`);
  };

  const renderMessageContent = (message: AiMessage) => {
    if (message.messageType === 'audio' && message.audioUrl) {
      return <AudioPlayer src={message.audioUrl} durationMs={message.audioDurationMs} />;
    }

    return <div className="whitespace-pre-line leading-relaxed">{message.content}</div>;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-50 via-indigo-50 to-white text-[#2200ffff]">
            <LuRocket className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">Start with Vin AI</span>
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
                'rounded-2xl px-3 py-2 shadow-sm min-w-[40%] max-w-[75%]',
                message.role === 'user' ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-800'
              )}
            >
              {renderMessageContent(message)}
            </div>
          </div>
        ))}

      {recommendations.length > 0 && (
          <div className="rounded-2xl border border-neutral-100 bg-white p-3 shadow-sm">
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
            <div className="mt-2 no-scrollbar flex gap-3 overflow-x-auto pb-1">
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
        <div className="relative">
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
        </div>
        
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
          disabled={isRecording}
        />
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
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-900 text-white shadow-sm transition hover:bg-neutral-800 disabled:opacity-60"
          aria-label="Send or hold to record"
        >
          {isRecording ? <span className="text-lg">●</span> : <TbArrowElbowRight size={20} />}
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