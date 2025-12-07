'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { MdVerified } from "react-icons/md";
import { FiSearch } from 'react-icons/fi';
import Avatar from './Avatar';

import { HiMiniMicrophone } from 'react-icons/hi2';
import { HiOutlinePaperClip } from 'react-icons/hi';

interface User {
  id: string;
  name: string;
  image?: string;
  hasUnread?: boolean;
  latestMessage?: string;
  latestMessageDate?: string;
  latestMessageCreatedAt?: string;
  latestMessageType?: 'text' | 'attachment' | 'audio';
}

interface ConversationListProps {
  onSelect: (user: User) => void;
  currentUserId: string;
}

const ConversationList: React.FC<ConversationListProps> = ({ onSelect, currentUserId }) => {
  const [users, setUsers] = useState<User[]>([]);
  const CUSTOMER_SERVICE_ID = '67ef2895f045b7ff3d0cf6fc';
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        image: '/images/operator.png',
        hasUnread: realCS?.hasUnread ?? false,
        latestMessage: realCS?.latestMessage || 'Ping us anytime!',
        latestMessageCreatedAt: realCS?.latestMessageCreatedAt || new Date().toISOString(),
        latestMessageType: realCS?.latestMessageType ?? 'text',
      };

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
          image: '/images/operator.png',
          hasUnread: customerServiceData?.hasUnread ?? false,
          latestMessage: customerServiceData?.latestMessage || 'Ping us anytime!',
          latestMessageCreatedAt:
            customerServiceData?.latestMessageCreatedAt || new Date().toISOString(),
          latestMessageType: customerServiceData?.latestMessageType ?? 'text',
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
    image: '/images/operator.png', // optional default avatar
    hasUnread: false,
    latestMessage: '🚀 Ping us anytime!',
    latestMessageCreatedAt: new Date().toISOString(),
  };

  return (
    <div className="p-4 space-y-3 overflow-y-auto h-full">
      <div className="relative mb-3">
        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg" />
        <input
          type="text"
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 p-2 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-black"
        />
      </div>
      <AnimatePresence mode="popLayout">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <div
                onClick={() => onSelect(user)}
                className="flex items-center justify-between gap-3 cursor-pointer shadow-md hover:bg-neutral-100 transition p-2 rounded-xl"
              >
                <div className="flex items-center gap-3 ml-3">
                  <motion.div
                    layoutId={`avatar-${user.id}`}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="relative"
                  >
                    <Avatar src={user.image} name={user.name} size={48} />

                    {user.id === CUSTOMER_SERVICE_ID && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 50 50"
                          width="20"
                          height="20"
                          style={{ display: 'inline-block', verticalAlign: 'middle' }}
                        >
                          <defs>
                            <linearGradient id="verifiedGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#2200ffff" />
                              <stop offset="50%" stopColor="#3d08ff" />
                              <stop offset="100%" stopColor="#3604ff" />
                            </linearGradient>
                          </defs>
                          <path
                            d="M45.103,24.995l3.195-6.245l-5.892-3.807l-0.354-7.006l-7.006-0.35l-3.81-5.89l-6.242,3.2l-6.245-3.196l-3.806,5.893
                            L7.938,7.948l-0.352,7.007l-5.89,3.81l3.2,6.242L1.702,31.25l5.892,3.807l0.354,7.006l7.006,0.35l3.81,5.891l6.242-3.2l6.245,3.195
                            l3.806-5.893l7.005-0.354l0.352-7.006l5.89-3.81L45.103,24.995z"
                            fill="url(#verifiedGradient)"
                          />
                          <path
                            d="M22.24,32.562l-6.82-6.819l2.121-2.121l4.732,4.731l10.202-9.888l2.088,2.154L22.24,32.562z"
                            fill="white"
                          />
                        </svg>
                      </div>
                    )}
                  </motion.div>

                  <div>
                    <span className="text-xl font-medium">{user.name}</span>
                    {user.latestMessage && (
                      <div className="text-sm text-neutral-500 flex flex-col max-w-[180px] truncate">
                        <div className="flex items-center gap-1 truncate">
                          {user.latestMessageType === 'audio' && (
                            <HiMiniMicrophone className="h-4 w-4 text-blue-600 flex-shrink-0" />
                          )}
                          {user.latestMessageType === 'attachment' && (
                            <HiOutlinePaperClip className="h-4 w-4 text-blue-600 flex-shrink-0" />
                          )}
                          <span className="truncate">{user.latestMessage}</span>
                        </div>
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
            </motion.div>
          ))
        ) : (
          <motion.p
            className="text-sm text-neutral-500 text-center mt-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            Active conversations will appear here
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ConversationList;