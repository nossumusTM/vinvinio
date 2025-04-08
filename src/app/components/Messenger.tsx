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

interface MessengerProps {
  currentUser?: SafeUser | null;
}

const Messenger = ({ currentUser }: MessengerProps) => {
  const isMobile = useMediaQuery({ maxWidth: 768 });

  const {
    isOpen,
    isChatOpen,
    recipient,
    close: closeMessenger,
    openList
  } = useMessenger();

  if (!isOpen || !currentUser?.id) return null;

  return (
    <Draggable
      bounds="parent"
      handle=".messenger-header"
      disabled={isMobile}
    >
    <div
        className={clsx(
          'z-50 bg-white shadow-sm hover:shadow-xl border rounded-t-3xl fixed transition-all flex flex-col',
          isMobile
            ? 'bottom-0 left-0 w-full h-[50vh]'
            : 'bottom-4 right-4 w-[500px] h-[700px] max-h-[90vh]'
        )}
      >
      <div className="messenger-header flex justify-between items-center p-3 border-b cursor-move">
        <p className="font-semibold text-xl pl-2">
          Messenger
        </p>
        <button className="pr-2" onClick={closeMessenger}>✕</button>
      </div>

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
  );
};

export default Messenger;