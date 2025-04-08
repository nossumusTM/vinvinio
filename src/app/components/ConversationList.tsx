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
  const CUSTOMER_SERVICE_ID = '67ef2895f045b7ff3d0cf6fc';

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
  
      const realCS = parsed.find((u: User) => u.id === CUSTOMER_SERVICE_ID);
      const customerServiceUser: User = {
        id: CUSTOMER_SERVICE_ID,
        name: 'Customer Service',
        image: '/images/customerservice.png',
        hasUnread: realCS?.hasUnread ?? false,
        latestMessage: realCS?.latestMessage || 'How can we help you?',
        latestMessageCreatedAt: realCS?.latestMessageCreatedAt || new Date().toISOString(),
      };
  
      // console.log('📦 Cached conversations loaded:', parsed);
      setUsers([customerServiceUser, ...parsed.filter((u: User) => u.id !== CUSTOMER_SERVICE_ID)]);
    }
  
    const fetchConversations = async () => {
      try {
        const res = await fetch(`/api/conversations`, {
          credentials: 'include',
        });
  
        const data = await res.json();
        // console.log('🌐 Conversations fetched from API:', data);
  
        if (!Array.isArray(data)) {
          console.error('❌ Unexpected conversations format:', data);
          return;
        }
  
        const customerServiceData = data.find((u) => u.id === CUSTOMER_SERVICE_ID);
        const otherUsers = data.filter((u) => u.id !== CUSTOMER_SERVICE_ID);
  
        const mergedCustomerServiceUser: User = {
          id: CUSTOMER_SERVICE_ID,
          name: 'Customer Service',
          image: '/images/customerservice.png',
          hasUnread: customerServiceData?.hasUnread ?? false,
          latestMessage: customerServiceData?.latestMessage || 'How can we help you?',
          latestMessageCreatedAt: customerServiceData?.latestMessageCreatedAt || new Date().toISOString(),
        };
  
        // setUsers([mergedCustomerServiceUser, ...otherUsers]);
        // localStorage.setItem(localKey, JSON.stringify([mergedCustomerServiceUser, ...otherUsers]));
        const shouldIncludeCS = currentUserId !== CUSTOMER_SERVICE_ID;
        const updatedList = shouldIncludeCS
          ? [mergedCustomerServiceUser, ...otherUsers]
          : [...otherUsers];

        setUsers(updatedList);
        localStorage.setItem(localKey, JSON.stringify(updatedList));

      } catch (err) {
        console.error('❌ Failed to fetch conversations:', err);
      }
    };
  
    fetchConversations();
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, [currentUserId]);  

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
                <div className="relative">
                  <Avatar src={user.image} name={user.name} size={48} />
                  {user.id === CUSTOMER_SERVICE_ID && (
                    <div
                      className="absolute -top-1 -right-1 w-5 h-5 bg-[#25F4EE] flex items-center justify-center"
                      style={{
                        clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
                        borderRadius: '4px',
                      }}
                    >
                      <svg
                        className="w-3 h-3 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                </div>


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