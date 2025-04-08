'use client';

import { useEffect, useRef, useState } from 'react';
import { TbTrash, TbSend } from 'react-icons/tb';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import ConfirmPopup from './ConfirmPopup';
import Avatar from './Avatar';

type Message = {
  id: string;
  senderId: string;
  text: string;
  createdAt: string;
  recipientId: string; // ✅ Add this
  seen: Boolean;
};

interface ChatViewProps {
  currentUserId: string;
  recipient: { id: string; name: string; image?: string };
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

  const scrollToBottom = (force = false) => {
    const container = scrollContainerRef.current;
    if (!container) return;
  
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
  
    if (force || isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
        console.log("✅ Messages fetched:", serverMessages); // <-- Add this
  
        setMessages((prevMessages) => {
          const optimisticMessages = prevMessages.filter((msg) => msg.id.startsWith('temp-'));
          return [...serverMessages, ...optimisticMessages];
        });
      } catch (err) {
        console.error('❌ Fetch messages error:', err);
      }
    };
  
    fetchMessages();
    const intervalId = setInterval(fetchMessages, 3000);
    return () => clearInterval(intervalId);
  }, [recipient?.id]);  

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

  const handleSend = async () => {
    if (!newMessage.trim()) return;
  
    const tempMessage: Message = {
      id: `temp-${Date.now()}`, // temp id
      senderId: currentUserId,
      recipientId: recipient.id,
      text: newMessage,
      createdAt: new Date().toISOString(),
      seen: false,
    };
  
    setMessages((prev) => [...prev, tempMessage]); // show optimistically
    setNewMessage('');
    scrollToBottom(true);
  
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId: recipient.id, text: newMessage }),
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
      const res = await fetch('/api/conversations/remove', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId: recipient.id }),
      });
  
      if (!res.ok) throw new Error('Failed to remove conversation');
  
      setShowConfirm(false);
      onBack();
    } catch (error) {
      console.error('Failed to remove conversation:', error);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b justify-between">
        <div className="flex items-center gap-3">
            <button onClick={onBack} className="text-sm text-neutral-600 hover:text-black">&larr;</button>
            <Avatar src={recipient.image} name={recipient.name} size={40} />
            <h4 className="font-semibold text-lg">{recipient.name}</h4>
        </div>
        <button
        onClick={() => setShowConfirm(true)}
        title="Remove from conversations"
        className="text-neutral-500 hover:text-red-600 transition"
        >
            <TbTrash size={20} />
        </button>
        </div>

      {/* Messages */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => {
          const isLast = index === messages.length - 1;
          return (
            <div
              key={msg.id}
              className={`max-w-[70%] transition-all duration-300 transform ${
                isLast ? 'scale-90 animate-scaleIn' : 'scale-100'
              } ${msg.senderId === currentUserId ? 'ml-auto text-right' : ''}`}
            >
              {/* Sender */}
              <div className="text-xs font-semibold text-neutral-500 mb-1">
                {msg.senderId === currentUserId ? 'Me' : recipient.name}
              </div>

              {/* Message bubble */}
              <div
                    className={`inline-block px-4 py-2 rounded-xl break-words whitespace-pre-wrap max-w-full ${
                        msg.senderId === currentUserId ? 'bg-black text-white' : 'bg-gray-200'
                    } ${
                        /^[\p{Emoji}\s]+$/u.test(msg.text.trim()) ? 'text-3xl' : 'text-sm'
                    }`}
                    >
                    {msg.text}
                </div>


              {/* Timestamp */}
              <div className="text-[10px] text-neutral-400 mt-1">
                {new Date(msg.createdAt).toLocaleString()}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

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
      <div className="p-3 border-t flex gap-2 bg-white sticky bottom-0 z-10">
        <form
            onSubmit={(e) => {
            e.preventDefault(); // prevent form reload
            handleSend();
            }}
            className="flex w-full items-center gap-2"
        >
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
            
            <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 border rounded-xl px-3 py-1 text-sm"
            placeholder="Type your message"
            />
            <button
            type="submit"
            className="text-neutral-600 hover:text-blue-600 transition"
            aria-label="Send"
            >
            <TbSend size={22} />
            </button>
        </form>
        </div>
    </div>
  );
};

export default ChatView;
