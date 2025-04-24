'use client';

import { useEffect, useState } from 'react';
import { useMediaQuery } from 'react-responsive';
import useMessenger from '../hooks/useMessager';
import clsx from 'clsx';
import ChatView from './ChatView';
import ConversationList from './ConversationList';
import { SafeUser } from '@/app/types';
import { useRef } from 'react';
import Draggable from 'react-draggable';
import { motion, AnimatePresence } from 'framer-motion';

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
            'fixed z-50',
            isMobile
              ? 'bottom-0 left-0 w-full h-[65vh] flex justify-center items-end'
              : 'bottom-4 right-4'
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
                'bg-white shadow-sm hover:shadow-xl border rounded-t-3xl pointer-events-auto flex flex-col',
                isMobile ? 'w-full h-full' : 'w-[500px] h-[700px] max-h-[90vh]'
              )}
            >
              {/* Header */}
              <div className="messenger-header flex justify-between items-center p-3 border-b cursor-move">
                <p className="font-medium text-xl pl-2">Messenger</p>
                <button className="pr-2" onClick={closeMessenger}>✕</button>
              </div>
  
              {/* Content */}
              {isChatOpen && recipient ? (
                <ChatView
                  currentUserId={currentUser.id}
                  recipient={recipient}
                  onBack={openList}
                />
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