'use client';

import { useCallback, useState, useRef, useEffect } from "react";
import { AiOutlineMenu } from "react-icons/ai";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import useMessenger from "@/app/hooks/useMessager";

import useLoginModal from "@/app/hooks/useLoginModal";
import usePromoteModal from '@/app/hooks/usePromoteModal';
import useRegisterModal from "@/app/hooks/useRegisterModal";
import useRentModal from "@/app/hooks/useRentModal";
import useTourModal from "@/app/hooks/useExperienceModal";
import { SafeUser } from "@/app/types";

import MenuItem from "./MenuItem";
import Avatar from "../Avatar";
import { twMerge } from "tailwind-merge";

interface UserMenuProps {
  currentUser?: SafeUser | null;
}

const getRandomColor = () => {
  const colors = [
    'bg-[#000]'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

const UserMenu: React.FC<UserMenuProps> = ({ currentUser }) => {
  const router = useRouter();

  const loginModal = useLoginModal();
  const registerModal = useRegisterModal();
  const rentModal = useTourModal();
  const promoteModal = usePromoteModal();

  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  // const [unreadCount, setUnreadCount] = useState(0);

  const messenger = useMessenger();

  const toggleOpen = useCallback(() => {
    setIsOpen((value) => !value);
  }, []);

  const onRent = useCallback(() => {
    if (!currentUser) {
      return loginModal.onOpen();
    }

    rentModal.onOpen();
  }, [loginModal, rentModal, currentUser]);

  const onPromote = () => {
    promoteModal.onOpen();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
  
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
  
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    const checkUnreadCount = () => {
      const userId = currentUser?.id;
      if (!userId) return;
    
      const convKey = `conversations_${userId}`;
      const cached = localStorage.getItem(convKey);
      if (cached) {
        const conversations = JSON.parse(cached);
        const count = conversations.reduce((acc: number, convo: any) => {
          return convo.hasUnread ? acc + 1 : acc;
        }, 0);
        // setUnreadCount(count);
        messenger.setUnreadCount(count); // ✅ this ensures badgeCount updates
      }
    };    
  
    checkUnreadCount();
    const interval = setInterval(checkUnreadCount, 3000);
    return () => clearInterval(interval);
  }, [currentUser?.id]);  

  useEffect(() => {
    const checkUnreadCount = async () => {
      const userId = currentUser?.id;
      if (!userId) return;
  
      try {
        const res = await fetch(`/api/conversations`);
        const data = await res.json();
  
        // Filter and count unread
        const unread = data.filter((c: any) => c.hasUnread).length;
  
        // Store to localStorage for consistency (optional)
        localStorage.setItem(`conversations_${userId}`, JSON.stringify(data));
  
        // Update badge
        messenger.setUnreadCount(unread);
      } catch (err) {
        console.error('Failed to fetch conversations:', err);
      }
    };
  
    checkUnreadCount();
    const interval = setInterval(checkUnreadCount, 5000);
    return () => clearInterval(interval);
  }, [currentUser?.id]);  

  const userRole = currentUser?.role;
  const initials = currentUser?.name?.[0]?.toUpperCase() || 'V';

  return (
    <div className="relative" ref={menuRef}>
      <div className="flex flex-row items-center gap-3">
        {userRole === 'host' && (
          <div
            onClick={onRent}
            className="
              hidden
              md:block
              text-sm 
              font-semibold 
              py-3 
              px-4 
              rounded-full 
              hover:bg-neutral-100 
              transition 
              cursor-pointer
            "
          >
            Add experience
          </div>
        )}

        {userRole === 'promoter' && (
          <div
            onClick={onPromote}
            className="
              hidden
              md:block
              text-sm 
              font-semibold 
              py-3 
              px-4 
              rounded-full 
              hover:bg-neutral-100 
              transition 
              cursor-pointer
            "
          >
            Promote QR-Code
          </div>
        )}

<div
  onClick={toggleOpen}
  className="
    relative
    p-4
    md:py-1
    md:px-2
    border-[1px] 
    border-neutral-200 
    flex 
    flex-row 
    items-center 
    gap-3 
    rounded-full 
    cursor-pointer 
    hover:shadow-md 
    transition
  "
>
  <AiOutlineMenu />

  {/* Avatar visible only on md+ screens */}
  <div className="hidden md:block">
    {currentUser?.image ? (
      <Avatar src={currentUser.image} />
    ) : (
      <div className={twMerge("w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm", getRandomColor())}>
        {initials}
      </div>
    )}
  </div>

  {/* Badge always visible, even on mobile */}
  {messenger.unreadCount > 0 && (
    <div className="absolute -top-1 -right-1 bg-[#25F4EE] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
      {messenger.unreadCount}
    </div>
  )}
</div>

      </div>

      {isOpen && (
        <div
          className="
            absolute 
            rounded-xl 
            shadow-md
            min-w-[220px]
            max-w-[300px]
            w-[70vw]
            md:w-[240px]
            bg-white 
            overflow-hidden 
            right-0 
            top-12 
            text-sm
          "
        >
          <div className="flex flex-col cursor-pointer">
            {currentUser ? (
              <>
                {(userRole === 'customer' || userRole === 'promoter' || userRole === 'host') && (
                  <>
                    <MenuItem
                      label="Messages"
                      onClick={messenger.openList}
                      badgeCount={messenger.unreadCount > 0 ? messenger.unreadCount : undefined}
                    />
                    <hr className="my-2" />
                  </>
                )}

                {userRole === 'customer' && (
                  <>
                    <MenuItem label="Trips" onClick={() => router.push('/trips')} />
                    <MenuItem label="Favorites" onClick={() => router.push('/favorites')} />
                    {(userRole === 'customer' || userRole === 'promoter' || userRole === 'host') && (
                        <>
                          <MenuItem label="Account" onClick={() => router.push('/profile')} />
                          <hr className="my-2" />
                        </>
                      )}
                  </>
                )}

                {userRole === 'promoter' && (
                  <>
                    {/* Only render on mobile as MenuItems */}
                    <div className="md:hidden">
                      <MenuItem label="Promote QR-Code" onClick={onPromote} />
                    </div>
                    <MenuItem label="Trips" onClick={() => router.push('/trips')} />
                    <MenuItem label="Favorites" onClick={() => router.push('/favorites')} />
                    {(userRole === 'promoter' || userRole === 'promoter' || userRole === 'host') && (
                        <>
                          <MenuItem label="Account" onClick={() => router.push('/profile')} />
                          <hr className="my-2" />
                        </>
                      )}
                  </>
                )}

                {userRole === 'host' && (
                  <>
                    <div className="md:hidden">
                      <MenuItem label="Add Experience" onClick={onRent} />
                    </div>
                    <MenuItem label="Trips" onClick={() => router.push('/trips')} />
                    <MenuItem label="Favorites" onClick={() => router.push('/favorites')} />
                    {(userRole === 'host') && (
                        <>
                          <MenuItem label="Account" onClick={() => router.push('/profile')} />
                          <hr className="my-2" />
                        </>
                    )}
                  </>
                )}

                <MenuItem label="Logout" onClick={() => signOut()} />
              </>
            ) : (
              <>
                  <MenuItem label="Login" onClick={loginModal.onOpen} />
                <hr className="my-2" />
                  <MenuItem label="Sign up" onClick={registerModal.onOpen} />

              </>
            )}
          </div>

        </div>
      )}
    </div>
  );
};

export default UserMenu;