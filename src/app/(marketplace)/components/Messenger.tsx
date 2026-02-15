'use client';

import { useEffect, useState } from 'react';
import { useMediaQuery } from 'react-responsive';
import useMessenger from '../hooks/useMessager';
import clsx from 'clsx';
import ChatView from './ChatView';
import ConversationList from './ConversationList';
import { SafeUser } from '@/app/(marketplace)/types';
import { useRef } from 'react';
import Draggable from 'react-draggable';
import { motion, AnimatePresence } from 'framer-motion';
import VinAiChatView from './VinAiChatView';
import { AI_FORCE_ASSISTANT } from '../hooks/useVinAiChat';

interface MessengerProps {
  currentUser?: SafeUser | null;
}

const Messenger = ({ currentUser }: MessengerProps) => {
  const isMobile = useMediaQuery({ maxWidth: 768 });
  const nodeRef = useRef(null);

  const {
    isOpen,
    isChatOpen,
    recipient,
    close: closeMessenger,
    openList
  } = useMessenger();

  // if (!isOpen || !currentUser?.id) return null;

  return (
    <AnimatePresence>
      {isOpen && currentUser?.id && (
        <motion.div
          key="messenger"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className={clsx(
            'fixed z-50 flex p-3 items-end justify-center',        // ⬅ flex + alignment
            isMobile
              ? 'bottom-0 left-0 h-[100dvh] w-full'            // ⬅ full height on mobile
              : 'bottom-4 right-4 h-[700px] w-[500px]'         // ⬅ fixed height on desktop
          )}
        >
          <Draggable
            nodeRef={nodeRef}
            handle=".messenger-header"
            disabled={isMobile}
          >
            <div
              ref={nodeRef}
              className={clsx(
                'pointer-events-auto flex h-full w-full flex-col rounded-3xl border bg-white shadow-sm hover:shadow-xl'
                // ⬆️ always fill the fixed outer box, no more h-[700px]/max-h logic
              )}
            >
              {/* Header */}
              <div className="messenger-header flex justify-between items-center p-3 border-b cursor-move">
                <p className="font-medium text-xl pl-2">Messenger</p>
                <button className="rounded-full text-xs shadow-md hover:shadow-lg aspect-square px-3 py-1 text-neutral-500 transition hover:text-neutral-900 hover:shadow-lg hover:bg-neutral-100" onClick={closeMessenger}>✕</button>
              </div>
  
              {/* Content */}
              {isChatOpen && recipient ? (
                <motion.div
                  key={recipient.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1 min-h-0"
                >
                  {recipient.id === AI_FORCE_ASSISTANT.id ? (
                    <VinAiChatView onBack={openList} />
                  ) : (
                    <ChatView
                      currentUserId={currentUser.id}
                      recipient={recipient}
                      onBack={openList}
                    />
                  )}
                </motion.div>
              ) : (
                <ConversationList
                  currentUserId={currentUser.id}
                  onSelect={(user) => useMessenger.getState().openChat(user)}
                />
              )}
            </div>
          </Draggable>
        </motion.div>
      )}
    </AnimatePresence>
  );  
};

export default Messenger;