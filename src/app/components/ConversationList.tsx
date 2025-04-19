'use client';

import { useEffect, useState } from 'react';
import { MdVerified } from "react-icons/md";
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
        name: 'Operator',
        image: '/images/operator.jpg',
        hasUnread: realCS?.hasUnread ?? false,
        latestMessage: realCS?.latestMessage || '🚀 Ping us anytime!',
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
          name: 'Operator',
          image: '/images/operator.jpg',
          hasUnread: customerServiceData?.hasUnread ?? false,
          latestMessage: customerServiceData?.latestMessage || '🚀 Ping us anytime!',
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
    name: 'Operator',
    image: '/images/operator.jpg', // optional default avatar
    hasUnread: false,
    latestMessage: '🚀 Ping us anytime!',
    latestMessageCreatedAt: new Date().toISOString(),
  };

  return (
    <div className="p-4 space-y-3 overflow-y-auto h-full">
      {users.length > 0 ? (
        users.map((user) => (
          <div key={user.id}>
            <div
              onClick={() => onSelect(user)}
              className="flex items-center justify-between gap-3 cursor-pointer shadow-md hover:bg-neutral-100 transition p-2 rounded-xl"
            >
              <div className="flex items-center gap-3 ml-3">
              <div className="relative">
                <Avatar src={user.image} name={user.name} size={48} />

                {user.id === CUSTOMER_SERVICE_ID && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 50 50"
                      width="20"
                      height="20"
                      style={{
                        display: 'inline-block',
                        verticalAlign: 'middle',
                      }}
                    >
                      <defs>
                        <linearGradient id="verifiedGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#08e2ff" />
                          <stop offset="50%" stopColor="#3d08ff" />
                          <stop offset="100%" stopColor="#3604ff" />
                        </linearGradient>
                      </defs>

                      {/* Outer burst */}
                      <path
                        d="M45.103,24.995l3.195-6.245l-5.892-3.807l-0.354-7.006l-7.006-0.35l-3.81-5.89l-6.242,3.2l-6.245-3.196l-3.806,5.893
                        L7.938,7.948l-0.352,7.007l-5.89,3.81l3.2,6.242L1.702,31.25l5.892,3.807l0.354,7.006l7.006,0.35l3.81,5.891l6.242-3.2l6.245,3.195
                        l3.806-5.893l7.005-0.354l0.352-7.006l5.89-3.81L45.103,24.995z"
                        fill="url(#verifiedGradient)"
                      />

                      {/* Checkmark only */}
                      <path
                        d="M22.24,32.562l-6.82-6.819l2.121-2.121l4.732,4.731l10.202-9.888l2.088,2.154L22.24,32.562z"
                        fill="white"
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
                <span className="text-3xl text-black-500 font-semibold ml-auto mr-2">•</span>
              )}
            </div>
            {/* <hr className="my-2" /> */}
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