'use client';

import { useEffect, useState } from 'react';
import Avatar from './Avatar';

interface User {
  id: string;
  name: string;
  image?: string;
  hasUnread?: boolean;
  latestMessage?: string;
  latestMessageDate?: string;
  latestMessageCreatedAt?: string;
}

interface ConversationListProps {
  onSelect: (user: User) => void;
  currentUserId: string;
}

const ConversationList: React.FC<ConversationListProps> = ({ onSelect, currentUserId }) => {
  const [users, setUsers] = useState<User[]>([]);

  // useEffect(() => {
  //   if (!currentUserId) return;

  //   const localKey = `conversations_${currentUserId}`;
  //   const cached = localStorage.getItem(localKey);

  //   if (cached) {
  //     // ⏱️ Show cached conversations instantly
  //     setUsers(JSON.parse(cached));
  //   }

  //   const fetchConversations = async () => {
  //     try {
  //       // const res = await fetch(`/api/conversations`);
  //       const res = await fetch(`/api/conversations`, {
  //         credentials: 'include', // 👈 important for authenticated routes
  //       });
  //       const text = await res.text();
  //       const data = text ? JSON.parse(text) : [];

  //       // ✅ Save in state and cache
  //       setUsers(data);
  //       localStorage.setItem(localKey, JSON.stringify(data));
  //     } catch (err) {
  //       console.error('Failed to fetch conversations:', err);
  //     }
  //   };

  //   // 🚀 Fetch updated conversations in background
  //   fetchConversations();
  //   const interval = setInterval(fetchConversations, 5000);
  //   return () => clearInterval(interval);
  // }, [currentUserId]);

  useEffect(() => {
    if (!currentUserId) return;
  
    const localKey = `conversations_${currentUserId}`;
    const cached = localStorage.getItem(localKey);
  
    if (cached) {
      const parsed = JSON.parse(cached);
      console.log('📦 Cached conversations loaded:', parsed);
      setUsers([customerServiceUser, ...parsed.filter((u: User) => u.id !== CUSTOMER_SERVICE_ID)]);
    }
  
    const fetchConversations = async () => {
      try {
        const res = await fetch(`/api/conversations`, {
          credentials: 'include',
        });
  
        const data = await res.json();
        console.log('🌐 Conversations fetched from API:', data);
  
        if (!Array.isArray(data)) {
          console.error('❌ Unexpected conversations format:', data);
          return;
        }
  
        setUsers([customerServiceUser, ...data.filter(u => u.id !== CUSTOMER_SERVICE_ID)]);
        localStorage.setItem(localKey, JSON.stringify([customerServiceUser, ...data.filter((u: User) => u.id !== CUSTOMER_SERVICE_ID)]));
      } catch (err) {
        console.error('❌ Failed to fetch conversations:', err);
      }
    };
  
    fetchConversations();
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, [currentUserId]);  

  const CUSTOMER_SERVICE_ID = 'support-id-001'; // 🔐 set this to your actual support user id
  const customerServiceUser: User = {
    id: CUSTOMER_SERVICE_ID,
    name: 'Customer Service',
    image: '/images/customerservice.png', // optional default avatar
    hasUnread: false,
    latestMessage: 'How can we help you?',
    latestMessageCreatedAt: new Date().toISOString(),
  };

  return (
    <div className="p-4 space-y-3 overflow-y-auto h-full">
      {users.length > 0 ? (
        users.map((user) => (
          <div key={user.id}>
            <div
              onClick={() => onSelect(user)}
              className="flex items-center justify-between gap-3 cursor-pointer hover:bg-neutral-100 p-2 rounded-xl"
            >
              <div className="flex items-center gap-3">
                <Avatar src={user.image} name={user.name} size={48} />
                <div>
                  <span className="text-xl font-medium">{user.name}</span>
                  {user.latestMessage && (
                    <div className="text-sm text-neutral-500 flex flex-col max-w-[180px] truncate">
                      <span className="truncate">{user.latestMessage}</span>
                      {user.latestMessageCreatedAt && (
                        <span className="text-[11px] text-neutral-400 mt-1">
                          {new Date(user.latestMessageCreatedAt).toLocaleString(undefined, {
                            hour: '2-digit',
                            minute: '2-digit',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {user.hasUnread && (
                <span className="text-xs text-red-500 font-semibold ml-auto">New</span>
              )}
            </div>
            <hr className="my-2" />
          </div>
        ))
      ) : (
        <p className="text-sm text-neutral-500 text-center mt-10">
          Active conversations will appear here
        </p>
      )}
    </div>
  );
};

export default ConversationList;