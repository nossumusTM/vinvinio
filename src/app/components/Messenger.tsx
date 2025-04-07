// 'use client';

// import { useEffect, useState } from 'react';
// import { useMediaQuery } from 'react-responsive';
// import useMessenger from '../hooks/useMessager';
// import clsx from 'clsx';
// import ChatView from './ChatView';
// import ConversationList from './ConversationList';

// const Messenger = ({ userId }: { userId?: string }) => {
//   const isMobile = useMediaQuery({ maxWidth: 768 });

//   const {
//     isOpen,
//     isChatOpen,
//     recipient,
//     close: closeMessenger,
//     openList
//   } = useMessenger();

//   if (!isOpen || !userId) return null;

//   return (
//     <div
//       className={clsx(
//         'z-50 bg-white shadow-sm hover:shadow-xl border rounded-t-3xl fixed transition-all flex flex-col',
//         isMobile
//           ? 'bottom-0 left-0 w-full h-[40vh]'
//           : 'bottom-4 right-4 w-[500px] h-[600px]'
//       )}
//     >
//       <div className="flex justify-between items-center p-3 border-b">
//         <p className="font-semibold text-xl pl-2">
//             Messenger
//         </p>
//         <button className="pr-2" onClick={closeMessenger}>✕</button>
//       </div>

//       {isChatOpen && recipient ? (
//         <ChatView
//           currentUserId={userId}
//           recipient={recipient}
//           onBack={openList}
//         />
//       ) : (
//         <ConversationList
//           currentUserId={userId}
//           onSelect={(user) => useMessenger.getState().openChat(user)}
//         />
//       )}
//     </div>
//   );
// };

// export default Messenger;

'use client';

import { useEffect, useState } from 'react';
import { useMediaQuery } from 'react-responsive';
import useMessenger from '../hooks/useMessager';
import clsx from 'clsx';
import ChatView from './ChatView';
import ConversationList from './ConversationList';
import { SafeUser } from '@/app/types'; // if not already imported

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
    <div
      className={clsx(
        'z-50 bg-white shadow-sm hover:shadow-xl border rounded-t-3xl fixed transition-all flex flex-col',
        isMobile
          ? 'bottom-0 left-0 w-full h-[40vh]'
          : 'bottom-4 right-4 w-[500px] h-[600px]'
      )}
    >
      <div className="flex justify-between items-center p-3 border-b">
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
  );
};

export default Messenger;