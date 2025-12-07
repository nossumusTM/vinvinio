'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { HiOutlinePaperClip  } from 'react-icons/hi';
import { HiMiniArrowDownTray } from "react-icons/hi2";
import { HiMiniMicrophone } from "react-icons/hi2";
import { TbHttpDelete, TbArrowElbowRight, TbPlayerPause, TbPlayerPlay, TbPlayerStopFilled } from 'react-icons/tb';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import ConfirmPopup from './ConfirmPopup';
import Avatar from './Avatar';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

type Message = {
  id: string;
  senderId: string;
  text?: string | null;
  messageType?: 'text' | 'attachment' | 'audio';
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  attachmentType?: string | null;
  attachmentSize?: number | null;
  audioUrl?: string | null;
  audioDurationMs?: number | null;
  createdAt: string;
  recipientId: string; // ✅ Add this
  seen: boolean;
};

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
        <div className="flex items-center justify-between text-[11px] text-neutral-500">
          <span className="flex items-center gap-1 font-medium text-neutral-700">
            {/* <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-700 shadow-sm">
              <HiMiniMicrophone size={14} />
            </span> */}
            {isPlaying ? 'Playing' : ''}
          </span>
          <span className="tabular-nums">{formatSeconds(currentTime)} / {formatSeconds(totalDuration || currentTime || 1)}</span>
        </div>
      </div>
      <button
        type="button"
        onClick={stopPlayback}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-neutral-600 shadow-sm ring-1 ring-neutral-200 transition hover:bg-neutral-100"
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

interface ChatViewProps {
  currentUserId: string;
  recipient: { id: string; name: string; image?: string; role?: string }; // + role?
  onBack: () => void;
}

const ChatView: React.FC<ChatViewProps> = ({ currentUserId, recipient, onBack }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [hasScrolledManually, setHasScrolledManually] = useState(false);
  const [hasSentGreeting, setHasSentGreeting] = useState(false);
  const greetingTriggeredRef = useRef(false);

  const [attachedFile, setAttachedFile] = useState<{
    url: string;
    name: string;
    type: string;
    size: number;
  } | null>(null);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [isSendingVoice, setIsSendingVoice] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStart, setRecordingStart] = useState<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTriggerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingActivatedRef = useRef(false);
  const attachmentInputRef = useRef<HTMLInputElement | null>(null);

  const router = useRouter();
  const CUSTOMER_SERVICE_ID = '67ef2895f045b7ff3d0cf6fc';
  const isOperator = recipient.id === CUSTOMER_SERVICE_ID;
  const recipientNameClean = recipient?.name?.trim() || null;

  const recipientProfilePath =
    !isOperator && recipient?.role === 'host'
      ? (recipientNameClean ? `/hosts/${encodeURIComponent(recipientNameClean)}` : null)
      : !isOperator
      ? (recipient?.id ? `/social-card/${encodeURIComponent(recipient.id)}` :
        recipientNameClean ? `/social-card/${encodeURIComponent(recipientNameClean)}` : null)
      : null;

  const handleRecipientNav = (e?: React.MouseEvent<HTMLElement>) => {
    if (!recipientProfilePath) return;
    if (e?.button === 1) { e.preventDefault(); window.open(recipientProfilePath, '_blank', 'noopener,noreferrer'); return; }
    if (e?.metaKey || e?.ctrlKey) { window.open(recipientProfilePath, '_blank', 'noopener,noreferrer'); return; }
    router.push(recipientProfilePath);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const supportTopics = ['Booking', 'Cancellation', 'Payment', 'Refund'];
  const uploadPreset = 'vuolapreset';
  const cloudName = 'dlomv0hbe';
  const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;

  const [awaitingTopic, setAwaitingTopic] = useState(false);
  const [awaitingIssue, setAwaitingIssue] = useState(false);

  const scrollToBottom = (force = false) => {
    const container = scrollContainerRef.current;
    if (!container) return;
  
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
  
    if (force || isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const formatFileSize = (size?: number | null) => {
    if (!size) return '';
    if (size > 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    return `${Math.round(size / 1024)} KB`;
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

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_UPLOAD_SIZE) {
      toast.error('Please choose a file that is 5MB or smaller.');
      e.target.value = '';
      return;
    }

    setIsUploadingAttachment(true);
    try {
      const url = await uploadToCloudinary(file);
      setAttachedFile({
        url,
        name: file.name,
        type: file.type,
        size: file.size,
      });
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload attachment.');
    } finally {
      setIsUploadingAttachment(false);
      e.target.value = '';
    }
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
      await handleSend({
        textOverride: 'Voice message',
        audio: { url, durationMs },
        attachment: null,
      });
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

  // Poll server for new messages
  // useEffect(() => {
  //   if (!recipient?.id) return;
  
  //   const fetchMessages = async () => {
  //     try {
  //       const res = await fetch(`/api/messages?recipientId=${recipient.id}`);
  //       if (!res.ok) throw new Error('Failed to fetch messages');
  //       const serverMessages: Message[] = await res.json();
  
  //       setMessages((prevMessages) => {
  //         const optimisticMessages = prevMessages.filter(
  //           (msg) => msg.id.startsWith('temp-') // keep temp/optimistic messages
  //         );
  
  //         // Merge server-confirmed and any optimistic messages
  //         return [...serverMessages, ...optimisticMessages];
  //       });
  //     } catch (err) {
  //       console.error('Fetch messages error:', err);
  //     }
  //   };
  
  //   fetchMessages();
  //   const intervalId = setInterval(fetchMessages, 3000);
  //   return () => clearInterval(intervalId);
  // }, [recipient?.id]);

  useEffect(() => {
    if (!recipient?.id) return;
  
    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/messages?recipientId=${recipient.id}`);
        if (!res.ok) throw new Error('Failed to fetch messages');
  
        const serverMessages: Message[] = await res.json();
        // console.log("✅ Messages fetched:", serverMessages); // <-- Add this   
  
        // setMessages((prevMessages) => {
        //   const optimisticMessages = prevMessages.filter((msg) => msg.id.startsWith('temp-'));
        //   return [...serverMessages, ...optimisticMessages];
        // });

        setMessages((prevMessages) => {
            const optimisticMessages = prevMessages.filter((msg) => msg.id.startsWith('temp-'));

            const dedupedMessages = serverMessages.filter(serverMsg =>
              !optimisticMessages.some(optMsg =>
                optMsg.recipientId === serverMsg.recipientId &&
                optMsg.messageType === serverMsg.messageType &&
                optMsg.text === serverMsg.text &&
                (optMsg.attachmentUrl ? optMsg.attachmentUrl === serverMsg.attachmentUrl : true) &&
                (optMsg.audioUrl ? optMsg.audioUrl === serverMsg.audioUrl : true) &&
                Math.abs(new Date(optMsg.createdAt).getTime() - new Date(serverMsg.createdAt).getTime()) < 5000
              )
            );
        
          return [...dedupedMessages, ...optimisticMessages];
        });
        
      } catch (err) {
        console.error('❌ Fetch messages error:', err);
      }
    };
  
    fetchMessages();
    const intervalId = setInterval(fetchMessages, 3000);
    return () => clearInterval(intervalId);
  }, [recipient?.id]);  

  // useEffect(() => {
  //   if (recipient.id !== CUSTOMER_SERVICE_ID) return;
  
  //   const greetingText = 'please specify the topic of assistance';
  //   const localGreetingKey = `greetingSent-${currentUserId}`;
  
  //   const hasGreeting = messages.some(
  //     (msg) =>
  //       msg.senderId === CUSTOMER_SERVICE_ID &&
  //       msg.recipientId === currentUserId &&
  //       msg.text.toLowerCase().includes(greetingText)
  //   );
  
  //   if (hasGreeting) {
  //     if (!hasSentGreeting) {
  //       const alreadyRespondedWithTopic = messages.some(
  //         (msg) =>
  //           msg.senderId === CUSTOMER_SERVICE_ID &&
  //           msg.recipientId === currentUserId &&
  //           msg.text.toLowerCase().includes('could you please describe your issue')
  //       );
  
  //       setHasSentGreeting(true);
  //       setAwaitingTopic(!alreadyRespondedWithTopic);
  //       setAwaitingIssue(alreadyRespondedWithTopic);
  //       localStorage.setItem(localGreetingKey, 'true');
  //     }
  //     return;
  //   }
  
  //   const hasBeenSentBefore = localStorage.getItem(localGreetingKey);
  
  //   // ✅ Only send greeting if this is the FIRST time user opens Customer Assistant chat
  //   const hasMessagesBetweenUserAndCS = messages.some(
  //     (msg) =>
  //       (msg.senderId === CUSTOMER_SERVICE_ID && msg.recipientId === currentUserId) ||
  //       (msg.senderId === currentUserId && msg.recipientId === CUSTOMER_SERVICE_ID)
  //   );
  
  //   if (!hasBeenSentBefore && !hasSentGreeting && !hasMessagesBetweenUserAndCS) {
  //     const sendGreeting = async () => {
  //       const greeting = `${getGreeting()}, nice to meet you here. Before we proceed, please specify the topic of assistance:`;
  
  //       try {
  //         await fetch('/api/messages/system', {
  //           method: 'POST',
  //           headers: { 'Content-Type': 'application/json' },
  //           body: JSON.stringify({
  //             senderId: CUSTOMER_SERVICE_ID,
  //             recipientId: currentUserId,
  //             text: greeting,
  //           }),
  //         });
  
  //         setMessages((prev) => [
  //           ...prev,
  //           {
  //             id: `greeting-${Date.now()}`,
  //             senderId: CUSTOMER_SERVICE_ID,
  //             recipientId: currentUserId,
  //             text: greeting,
  //             createdAt: new Date().toISOString(),
  //             seen: true,
  //           },
  //         ]);
  
  //         setHasSentGreeting(true);
  //         setAwaitingTopic(true);
  //         localStorage.setItem(localGreetingKey, 'true');
  //       } catch (err) {
  //         console.error('Failed to send greeting:', err);
  //       }
  //     };
  
  //     sendGreeting();
  //   }
  // }, [messages, recipient.id, currentUserId, hasSentGreeting]);  

  // useEffect(() => {
  //   if (
  //     hasSentGreeting ||
  //     greetingTriggeredRef.current ||
  //     recipient.id !== CUSTOMER_SERVICE_ID
  //   )
  //     return;
  
  //   const greetingText = 'please specify the topic of assistance';
  //   const localGreetingKey = `greetingSent-${currentUserId}`;
  
  //   const hasGreeting = messages.some(
  //     (msg) =>
  //       msg.senderId === CUSTOMER_SERVICE_ID &&
  //       msg.recipientId === currentUserId &&
  //       msg.text.toLowerCase().includes(greetingText)
  //   );
  
  //   if (hasGreeting) {
  //     if (!hasSentGreeting) {
  //       const alreadyRespondedWithTopic = messages.some(
  //         (msg) =>
  //           msg.senderId === CUSTOMER_SERVICE_ID &&
  //           msg.recipientId === currentUserId &&
  //           msg.text.toLowerCase().includes('could you please describe your issue')
  //       );
  
  //       setHasSentGreeting(true);
  //       setAwaitingTopic(!alreadyRespondedWithTopic);
  //       setAwaitingIssue(alreadyRespondedWithTopic);
  //       localStorage.setItem(localGreetingKey, 'true');
  //     }
  //     return;
  //   }
  
  //   const hasBeenSentBefore = localStorage.getItem(localGreetingKey);
  
  //   const hasMessagesBetweenUserAndCS = messages.some(
  //     (msg) =>
  //       (msg.senderId === CUSTOMER_SERVICE_ID && msg.recipientId === currentUserId) ||
  //       (msg.senderId === currentUserId && msg.recipientId === CUSTOMER_SERVICE_ID)
  //   );
  
  //   if (!hasBeenSentBefore && !hasSentGreeting && !hasMessagesBetweenUserAndCS) {
  //     greetingTriggeredRef.current = true; // ⬅️ Prevent future re-triggers
  
  //     const sendGreeting = async () => {
  //       const greeting = `${getGreeting()}, nice to meet you here. Before we proceed, please specify the topic of assistance:`;
  
  //       try {
  //         await fetch('/api/messages/system', {
  //           method: 'POST',
  //           headers: { 'Content-Type': 'application/json' },
  //           body: JSON.stringify({
  //             senderId: CUSTOMER_SERVICE_ID,
  //             recipientId: currentUserId,
  //             text: greeting,
  //           }),
  //         });
  
  //         setMessages((prev) => [
  //           ...prev,
  //           {
  //             id: `greeting-${Date.now()}`,
  //             senderId: CUSTOMER_SERVICE_ID,
  //             recipientId: currentUserId,
  //             text: greeting,
  //             createdAt: new Date().toISOString(),
  //             seen: true,
  //           },
  //         ]);
  
  //         setHasSentGreeting(true);
  //         setAwaitingTopic(true);
  //         localStorage.setItem(localGreetingKey, 'true');
  //       } catch (err) {
  //         console.error('Failed to send greeting:', err);
  //       }
  //     };
  
  //     sendGreeting();
  //   }
  // }, [messages, recipient.id, currentUserId, hasSentGreeting]);
  
  useEffect(() => {
    if (recipient.id !== CUSTOMER_SERVICE_ID || messages.length === 0) return;
  
    const hasTopicResponse = messages.some(
        (msg) =>
          msg.senderId === CUSTOMER_SERVICE_ID &&
          msg.recipientId === currentUserId &&
          msg.text?.toLowerCase().includes('could you please describe your issue')
      );
  
    if (hasTopicResponse) {
      setAwaitingTopic(false);
      setAwaitingIssue(true);
    }
  }, [messages, recipient.id, currentUserId]);  

  useEffect(() => {
    if (!awaitingIssue || recipient.id !== CUSTOMER_SERVICE_ID) return;
  
    const assistantHasReplied = messages.some(
      (msg) =>
        msg.senderId === CUSTOMER_SERVICE_ID &&
        msg.recipientId === currentUserId &&
        msg.text &&
        !msg.text.toLowerCase().includes('could you please describe your issue') && // exclude system response
        !msg.text.toLowerCase().includes('please specify the topic of assistance')  // exclude greeting
    );
  
    if (assistantHasReplied) {
      setAwaitingIssue(false);
    }
  }, [messages, awaitingIssue, recipient.id, currentUserId]);  

  // Mark as seen + update conversation list in localStorage
  // useEffect(() => {
  //   const markMessagesSeen = async () => {
  //     try {
  //       await fetch('/api/messages/mark-seen', {
  //         method: 'POST',
  //         headers: { 'Content-Type': 'application/json' },
  //         body: JSON.stringify({ senderId: recipient?.id }),
  //       });

  //     } catch (error) {
  //       console.error('Error marking messages as seen:', error);
  //     }
  //   };

  //   if (recipient?.id) {
  //     markMessagesSeen();
  //   }
  // }, [recipient?.id]);

  // Mark as seen after a short delay
  useEffect(() => {
    if (!recipient?.id) return;

    const timer = setTimeout(() => {
      const markMessagesSeen = async () => {
        try {
          await fetch('/api/messages/mark-seen', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ senderId: recipient.id }),
          });
        } catch (error) {
          console.error('Error marking messages as seen:', error);
        }
      };

      markMessagesSeen();
    }, 3000); // Delay to let unread state settle

    return () => clearTimeout(timer); // Cleanup on unmount or change
  }, [recipient?.id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (!hasScrolledManually && messages.length > 0) {
      scrollToBottom(true); // force scroll on message changes
    }
  }, [messages, hasScrolledManually]);

  const handleEmojiSelect = (emoji: any) => {
    setNewMessage((prev) => prev + emoji.native);
    setShowEmojiPicker(false);
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
  
    const handleUserScroll = () => {
      const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
      // If user scrolled up more than 150px from bottom, we assume manual scroll
      setHasScrolledManually(distanceFromBottom > 150);
    };
  
    container.addEventListener('scroll', handleUserScroll);
    return () => container.removeEventListener('scroll', handleUserScroll);
  }, []);  

  const handleSend = async (options?: {
    textOverride?: string;
    attachment?: { url: string; name: string; type: string; size: number } | null;
    audio?: { url: string; durationMs: number } | null;
  }) => {
    const attachmentPayload =
      options?.attachment === undefined ? attachedFile : options?.attachment;
    const audioPayload = options?.audio;
    const composedText = options?.textOverride ?? newMessage.trim();

    if (!composedText && !attachmentPayload && !audioPayload) return;

    const messageType = audioPayload
      ? 'audio'
      : attachmentPayload
      ? 'attachment'
      : 'text';
  
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      senderId: currentUserId,
      recipientId: recipient.id,
      text:
        composedText ||
        (messageType === 'audio'
          ? 'Voice message'
          : attachmentPayload?.name || ''),
      messageType,
      attachmentUrl: attachmentPayload?.url,
      attachmentName: attachmentPayload?.name,
      attachmentType: attachmentPayload?.type,
      attachmentSize: attachmentPayload?.size,
      audioUrl: audioPayload?.url,
      audioDurationMs: audioPayload?.durationMs,
      createdAt: new Date().toISOString(),
      seen: false,
    };
  
    setMessages((prev) => [...prev, tempMessage]);
    if (!options?.textOverride) {
      setNewMessage('');
    }
    if (attachmentPayload) {
      setAttachedFile(null);
    }
    scrollToBottom(true);

    if (awaitingIssue) setAwaitingIssue(false);
  
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientId: recipient.id,
          text: composedText,
          attachmentUrl: attachmentPayload?.url,
          attachmentName: attachmentPayload?.name,
          attachmentType: attachmentPayload?.type,
          attachmentSize: attachmentPayload?.size,
          audioUrl: audioPayload?.url,
          audioDurationMs: audioPayload?.durationMs,
        }),
      });
  
      if (!res.ok) {
        console.error('Failed to send message');
        return;
      }
  
      const confirmed: Message = await res.json();
  
      setMessages((prev) => {
        const withoutTemp = prev.filter((msg) => msg.id !== tempMessage.id);
        return [...withoutTemp, confirmed];
      });
    } catch (error) {
      console.error('Send message error:', error);
    }
  };  

  const handleRemoveConversation = async () => {
    try {
      const res = await fetch('/api/conversations/remove', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId: recipient.id }),
      });
  
      if (!res.ok) {
        throw new Error('Failed to remove conversation');
      }
  
      onBack();
    } catch (error) {
      console.error('Failed to remove conversation:', error);
    }
  };  

  const confirmRemoveConversation = async () => {
    try {
      if (recipient.id === CUSTOMER_SERVICE_ID) {
        const res = await fetch('/api/messages/delete-conversation', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipientId: CUSTOMER_SERVICE_ID,
          }),
        });
  
        if (!res.ok) throw new Error('Failed to delete Operator messages');
  
        // ✅ Clear frontend state
        setMessages([]);
        setHasSentGreeting(false);
        setAwaitingTopic(false);
        setAwaitingIssue(false);
        setShowConfirm(false);
  
        // ✅ Clear greeting memory from localStorage
        localStorage.removeItem(`greetingSent-${currentUserId}`);
  
        return;
      }
  
      // Handle other conversations normally
      const res = await fetch('/api/conversations/remove', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId: recipient.id }),
      });
  
      if (!res.ok) throw new Error('Failed to remove conversation');
      onBack();
    } catch (error) {
      console.error('Failed to remove conversation:', error);
    }
  };  

  return (
    <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.25 }}
    className="flex flex-col h-full max-h-screen overflow-hidden"
  >
    <div className="flex flex-col h-full max-h-screen overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b justify-between">
        <div className="flex items-center gap-3">
            <button onClick={onBack} className="text-sm text-neutral-600 hover:text-black">&larr;</button>
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                <Avatar src={recipient.image} name={recipient.name} size={40} />
              </motion.div>

                {recipientProfilePath ? (
                  <button
                    type="button"
                    onClick={handleRecipientNav}
                    onAuxClick={handleRecipientNav}
                    className="font-semibold text-lg underline-offset-2 hover:underline"
                  >
                    {recipient.name}
                  </button>
                ) : (
                  <h4 className="font-semibold text-lg">{recipient.name}</h4>
                )}

        </div>
        <button
        onClick={() => setShowConfirm(true)}
        title="Remove from conversations"
        className="text-neutral-500 hover:text-red-600 transition"
        >
            <TbHttpDelete size={20} />
        </button>
        </div>

      {/* Messages */}
      <div 
        ref={scrollContainerRef}
        className="flex-grow overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => {
          const isAudioMessage = Boolean(msg.audioUrl);
          const isImageAttachment =
            msg.attachmentUrl &&
            (msg.attachmentType?.startsWith('image/') || /\.(png|jpe?g|gif|webp)$/i.test(msg.attachmentUrl));
          const bubbleClass = isAudioMessage || !msg.attachmentUrl
            ? 'bg-sky-50 text-neutral-900 border border-sky-100 shadow-sm'
            : 'bg-white/90 text-neutral-900 border border-neutral-200 shadow-sm';
          const emojiOnly = msg.text ? /^[\p{Emoji}\s]+$/u.test(msg.text.trim()) : false;
          return (
            <motion.div
                key={msg.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                className={`max-w-[70%] ${
                  msg.senderId === currentUserId ? 'ml-auto text-right' : ''
                }`}
              >

              {/* Sender */}
              <div className="text-xs font-semibold text-neutral-500 mb-1">
                {msg.senderId === currentUserId ? 'Me' : recipient.name}
              </div>

              {/* Message bubble */}
              <div
              className={`inline-flex flex-col gap-2 px-4 py-3 rounded-xl break-words whitespace-pre-wrap max-w-full ${bubbleClass}`}
              >
                {msg.audioUrl && (
                  <div className="flex flex-col gap-3 rounded-xl border border-sky-100 bg-sky-50/80 px-3 py-2 shadow-sm">
                    {/* <div className="flex items-center gap-3 text-sm font-semibold text-blue-800">
                      <motion.span
                        initial={{ scale: 0.9, opacity: 0.8 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.6 }}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-700 shadow"
                      >
                        <HiMiniMicrophone />
                      </motion.span>
                      <div className="flex flex-col leading-tight">
                        <span>Voice note</span>
                        <span className="text-[11px] font-normal text-neutral-500">
                          {msg.audioDurationMs ? `${Math.max(1, Math.round(msg.audioDurationMs / 1000))}s` : 'Tap play to listen'}
                        </span>
                      </div>
                    </div> */}
                    <AudioPlayer src={msg.audioUrl} durationMs={msg.audioDurationMs} />
                  </div>
                )}

                {isImageAttachment && msg.attachmentUrl && (
                  <a
                    href={msg.attachmentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="block overflow-hidden rounded-xl border border-sky-100 bg-white/80 shadow-sm"
                  >
                    <img
                      src={msg.attachmentUrl}
                      alt={msg.attachmentName || 'Image attachment'}
                      className="max-h-64 w-full object-cover"
                    />
                    {/* <div className="flex items-center justify-between px-3 py-2 text-sm text-neutral-700">
                      <div className="flex items-center gap-2">
                        <HiOutlinePaperClip className="text-blue-600" />
                        <span className="font-medium">{msg.attachmentName || 'Image'}</span>
                      </div>
                      <HiMiniArrowDownTray className="text-blue-600" />
                    </div> */}
                  </a>
                )}

                {msg.attachmentUrl && !isImageAttachment && (
                  <a
                    href={msg.attachmentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-blue-200 bg-white/80 px-3 py-2 text-sm text-neutral-800 shadow-sm transition hover:shadow-md"
                  >
                    {/* <div className="flex items-center gap-2">
                      <HiOutlinePaperClip className="text-blue-600" />
                      <div className="flex flex-col">
                        <span className="font-semibold leading-tight">
                          {msg.attachmentName || 'Attachment'}
                        </span>
                        <span className="text-[11px] text-neutral-500">
                          {(msg.attachmentType || 'File')}
                          {msg.attachmentSize ? ` • ${formatFileSize(msg.attachmentSize)}` : ''}
                        </span>
                      </div>
                    </div> */}
                    {/* <HiMiniArrowDownTray className="text-blue-600" /> */}
                  </a>
                )}

                {msg.text && (
                  <div className={`${emojiOnly ? 'text-3xl' : 'text-sm'} flex items-start gap-2`}>
                    {/* <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 shadow-sm">
                      <TbArrowElbowRight size={14} />
                    </span> */}
                    <span>{msg.text}</span>
                  </div>
                )}
              </div>

              {/* Timestamp */}
              <div className="text-[10px] text-neutral-400 mt-1">
                {new Date(msg.createdAt).toLocaleString()}
              </div>
              </motion.div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {awaitingTopic && (
        <div className="flex flex-row gap-2 justify-start items-start p-4 overflow-y-auto max-h-64 ml-0">
          {supportTopics.map((topic) => (
            <button
              key={topic}
              onClick={async () => {
                const now = new Date().toISOString();
              
                const topicMessage = {
                  text: topic,
                  recipientId: CUSTOMER_SERVICE_ID,
                };
              
                const responseMessage = {
                  text: `Thank you for getting in touch about "${topic}". Could you please describe your issue in a few words?`,
                  recipientId: currentUserId,
                  senderId: CUSTOMER_SERVICE_ID,
                };
              
                try {
                  // 1. Send user's selected topic to Operator
                  await fetch('/api/messages', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(topicMessage),
                  });
              
                  // 2. Optimistically render user's message
                  setMessages((prev) => [
                    ...prev,
                    {
                      id: `topic-${now}`,
                      senderId: currentUserId,
                      recipientId: CUSTOMER_SERVICE_ID,
                      text: topic,
                      createdAt: now,
                      seen: true,
                    },
                  ]);
              
                  // 3. Send system response from Operator (server-side message)
                  await fetch('/api/messages/system', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(responseMessage),
                  });
              
                  // 4. Optimistically render Operator reply
                  setMessages((prev) => [
                    ...prev,
                    {
                      id: `response-${Date.now()}`,
                      senderId: CUSTOMER_SERVICE_ID,
                      recipientId: currentUserId,
                      text: responseMessage.text,
                      createdAt: new Date().toISOString(),
                      seen: true,
                    },
                  ]);
                } catch (error) {
                  console.error('Error sending topic selection or system reply:', error);
                }
              
                setAwaitingTopic(false);
                setAwaitingIssue(true);
              }}                       
              className="bg-neutral-100 rounded-xl px-4 py-2 w-full text-left hover:bg-neutral-200 transition"
            >
              {topic}
            </button>
          ))}
        </div>
      )}

      {awaitingIssue && (
        <div className="text-sm text-neutral-400 text-center mt-2 italic">
          Customer assistant will respond as soon as possible.
        </div>
      )}

      {messages.length === 0 && (
        <div className="text-sm text-neutral-400 text-center mt-4">
          No messages to show.
        </div>
      )}

      {showConfirm && (
        <ConfirmPopup
            title="Remove Conversation"
            message={`Are you sure you want to remove the conversation with ${recipient.name}?`}
            onConfirm={confirmRemoveConversation}
            onCancel={() => setShowConfirm(false)}
            confirmLabel="Remove"
            cancelLabel="Cancel"
        />
        )}


      {/* Sticky Input */}
      <div className="p-3 border-t bg-white md:sticky md:bottom-0 z-10 flex flex-col gap-2">
        <div className="flex items-center justify-between text-[11px] text-neutral-500 px-1">
          <span className="font-medium text-neutral-700">Hold the send button to record a voice note.</span>
          {(isRecording || isSendingVoice || isUploadingAttachment) && (
            <span className="flex items-center gap-2 text-blue-600 font-semibold">
              {isRecording ? 'Recording…' : isSendingVoice ? 'Sending voice…' : 'Uploading…'}
            </span>
          )}
        </div>

        {attachedFile && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                <HiOutlinePaperClip />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-neutral-800">{attachedFile.name}</span>
                <span className="text-xs text-neutral-500">{formatFileSize(attachedFile.size)}</span>
              </div>
            </div>
            <button
              type="button"
              className="text-xs text-neutral-500 hover:text-neutral-800"
              onClick={() => setAttachedFile(null)}
              aria-label="Remove attachment"
            >
              ✕
            </button>
          </div>
        )}

        {isRecording && (
          <div className="flex items-center gap-3 rounded-2xl border border-blue-200/70 bg-white/70 px-3 py-2 shadow-[0_0_25px_rgba(54,4,255,0.2)]">
            <div className="relative h-10 w-10">
              <span className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping" />
              <span className="absolute inset-1 rounded-full bg-blue-500/30 blur-sm" />
              <span className="absolute inset-2 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-[0_0_16px_rgba(54,4,255,0.7)]">
                <HiMiniMicrophone />
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

        <form
            onSubmit={(e) => {
            e.preventDefault();
            handleSend();
            }}
            className="flex w-full items-center gap-3"
          >
          <input
            ref={attachmentInputRef}
            type="file"
            accept="*/*"
            className="hidden"
            onChange={handleFileInputChange}
          />

          {/* Emoji toggle button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowEmojiPicker((prev) => !prev)}
              className="text-neutral-600 hover:text-yellow-500 transition"
            >
                😎
            </button>

            {/* Emoji picker dropdown */}
            {showEmojiPicker && (
              <div className="absolute bottom-12 left-0 z-50">
                <Picker data={data} onEmojiSelect={handleEmojiSelect} theme="light" previewPosition="none" />
                </div>
            )}
            </div>

          <button
            type="button"
            onClick={() => attachmentInputRef.current?.click()}
            className="rounded-full border border-neutral-200 bg-white p-2 text-neutral-600 shadow-sm transition hover:text-neutral-900 disabled:opacity-50"
            disabled={isUploadingAttachment || isRecording || isSendingVoice}
            aria-label="Add attachment"
          >
            <HiOutlinePaperClip size={18} />
          </button>

          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 shadow-md rounded-lg px-4 py-2 text-base border border-neutral-200"
            placeholder="Type your message"
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
            className={`flex h-10 w-10 items-center justify-center rounded-full transition shadow-sm ${
              isRecording
                ? 'bg-blue-600 text-white shadow-[0_0_18px_rgba(54,4,255,0.5)]'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
            aria-label="Send or hold to record"
            disabled={isUploadingAttachment || isSendingVoice}
          >
            {isRecording ? <span className="text-lg">●</span> : <TbArrowElbowRight size={20} />}
          </button>
        </form>
        </div>
    </div>
    </motion.div>
  );
};

export default ChatView;
