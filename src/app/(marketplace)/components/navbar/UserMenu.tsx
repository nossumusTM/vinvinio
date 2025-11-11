'use client';

import { useCallback, useState, useRef, useEffect } from "react";
import { AiOutlineMenu, AiOutlineBell } from "react-icons/ai";
import { FaHandshake } from "react-icons/fa";
import { FcBusinessContact } from "react-icons/fc";
import { MdOutlineBusinessCenter } from "react-icons/md";

import { signOut } from "next-auth/react";
import useMessenger from "@/app/(marketplace)/hooks/useMessager";
import { useRouter } from 'next/navigation';

import useLoginModal from "@/app/(marketplace)/hooks/useLoginModal";
import usePromoteModal from '@/app/(marketplace)/hooks/usePromoteModal';
import useRegisterModal from "@/app/(marketplace)/hooks/useRegisterModal";
import { SafeUser } from "@/app/(marketplace)/types";
import { profilePathForUser } from "@/app/(marketplace)/utils/profilePath";
import { motion, AnimatePresence } from 'framer-motion';

import LocaleButton from "./LocaleButton";

import MenuItem from "./MenuItem";
import Avatar from "../Avatar";
import NotificationsPanel, {
  type NotificationItem,
} from "./NotificationsPanel";

interface UserMenuProps {
  currentUser?: SafeUser | null;
  showLocaleInMenu?: boolean; // ← add
}

const getRandomColor = () => {
  const colors = [
    'bg-[#08e2ff]'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

const UserMenu: React.FC<UserMenuProps> = ({ currentUser, showLocaleInMenu = false }) => {

  const loginModal = useLoginModal();
  const registerModal = useRegisterModal();
  const promoteModal = usePromoteModal();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationFreshCount, setNotificationFreshCount] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  // const [unreadCount, setUnreadCount] = useState(0);

  const messenger = useMessenger();

  const profileHref = profilePathForUser(currentUser) ?? '/profile';

  const slugify = (s: string) =>
    s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  const hostHandle =
    currentUser?.username ??
    (currentUser?.name ? slugify(currentUser.name) : currentUser?.id ?? '');

  const hostCardHref = hostHandle ? `/hosts/${encodeURIComponent(hostHandle)}` : '/hosts';

  const notificationsLastSeenKey = currentUser?.id
    ? `notifications:last-seen:${currentUser.id}`
    : null;

  const markNotificationsSeen = useCallback(() => {
    if (!notificationsLastSeenKey || typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.setItem(notificationsLastSeenKey, new Date().toISOString());
      setNotificationFreshCount(0);
    } catch (error) {
      console.error('❌ Failed to persist notifications last seen:', error);
    }
  }, [notificationsLastSeenKey]);


  const toggleOpen = useCallback(() => {
    setIsOpen((value) => !value);
  }, []);

  const handleNotificationsOpen = useCallback(() => {
    setIsOpen(false);
    setNotificationsOpen(true);
  }, []);

  const handleNotificationsClose = useCallback(() => {
    setNotificationsOpen(false);
    markNotificationsSeen();
  }, [markNotificationsSeen]);

  const onRent = useCallback(() => {
    if (!currentUser) {
      return loginModal.onOpen();
    }

    router.push('/become-a-partner');
  }, [loginModal, currentUser, router]);

  const onPromote = () => {
    promoteModal.onOpen();
  };

  // useEffect(() => {
  //   if (currentUser?.role === 'promoter') {
  //     router.push('/profile');
  //   }
  // }, [currentUser?.role]);

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
      try {
        const parsed = JSON.parse(cached || '[]');
        if (Array.isArray(parsed)) {
          const count = parsed.reduce((acc: number, convo: any) => {
            return convo.hasUnread ? acc + 1 : acc;
          }, 0);
          messenger.setUnreadCount(count);
        } else {
          messenger.setUnreadCount(0);
        }
      } catch (error) {
        console.error('❌ Failed to parse cached conversations:', error);
        messenger.setUnreadCount(0);
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
        const res = await fetch('/api/conversations', {
          // credentials: 'same-origin',
          credentials: 'include',
        });
        const data = await res.json();
  
        if (!Array.isArray(data)) {
          throw new Error('Conversations response is not an array');
        }
  
        // const unread = data.filter((c: any) => c.hasUnread).length;

        const unread = data.reduce((count, convo) => {
          if (convo.hasUnread) return count + 1;
          return count;
        }, 0);
        
        localStorage.setItem(`conversations_${userId}`, JSON.stringify(data));
        messenger.setUnreadCount(unread);
      } catch (err) {
        console.error('❌ Failed to fetch conversations:', err);
      }
    };
  
    checkUnreadCount();
    const interval = setInterval(checkUnreadCount, 5000);
    return () => clearInterval(interval);
  }, [currentUser?.id]);  

  useEffect(() => {
    if (!currentUser?.id) {
      return;
    }

    let cancelled = false;

    const loadSummary = async () => {
      try {
        const response = await fetch('/api/notifications?limit=20', {
          credentials: 'include',
        });

        if (cancelled) {
          return;
        }

        if (response.status === 401) {
          setNotificationFreshCount(0);
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to fetch notifications summary');
        }

        const data = (await response.json()) as NotificationItem[];

        if (!Array.isArray(data) || typeof window === 'undefined') {
          setNotificationFreshCount(0);
          return;
        }

        const lastSeenIso = notificationsLastSeenKey
          ? window.localStorage.getItem(notificationsLastSeenKey)
          : null;
        const lastSeenTimestamp = lastSeenIso ? new Date(lastSeenIso).getTime() : 0;

        const freshCount = data.reduce((count, item) => {
          if (!item?.createdAt) {
            return count;
          }

          const createdAt = new Date(item.createdAt).getTime();
          if (!Number.isFinite(createdAt)) {
            return count;
          }

          return !lastSeenTimestamp || createdAt > lastSeenTimestamp ? count + 1 : count;
        }, 0);

        setNotificationFreshCount(freshCount);
      } catch (error) {
        if (!cancelled) {
          console.error('❌ Failed to fetch notifications summary:', error);
        }
      }
    };

    loadSummary();
    const interval = window.setInterval(loadSummary, 60_000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [currentUser?.id, notificationsLastSeenKey]);

  useEffect(() => {
    if (notificationsOpen) {
      markNotificationsSeen();
    }
  }, [notificationsOpen, markNotificationsSeen]);

  const userRole = currentUser?.role;
  const initials = currentUser?.name?.[0]?.toUpperCase() || 'V';

  return (
    <div className="relative" ref={menuRef}>
      <div className="flex flex-row items-center gap-3">
        {/* {userRole === 'host' && (
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
            Submit Listing
          </div>
        )} */}

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
            Vuola Passcode
          </div>
        )}

<div
  onClick={toggleOpen}
  className="
    relative
    p-4
    md:py-1
    md:px-2
    flex 
    flex-row 
    items-center 
    backdrop-blur
    gap-3 
    rounded-full 
    cursor-pointer
    shadow-md 
    hover:shadow-lg
    transition
  "
>
  <AiOutlineMenu strokeWidth={4}/>

  {/* Avatar visible only on md+ screens */}
  <div className="hidden md:block shadow-xl rounded-full">
    {currentUser?.image ? (
      <Avatar src={currentUser.image} size={30}/>
    ) : (
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm bg-black"
        // style={{
        //   background: 'linear-gradient(135deg, #08e2ff, #04aaff, #0066ff, #0066ff, #ffffff)',
        // }}
      >
        {initials}
      </div>
    )}
  </div>

  {/* Badge always visible, even on mobile */}
  {/* {messenger.unreadCount > 0 && (
    <div className="absolute -top-1 -right-1 bg-[#08e2ff] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
      {messenger.unreadCount}
    </div>
  )} */}

  {messenger.unreadCount > 0 && (
    <motion.div
      key={messenger.unreadCount} // Ensures animation runs on change
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="absolute -top-1 -right-1 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center bg-black"
      // style={{
      //   background: 'linear-gradient(135deg, #3604ff, #04aaff, #3604ff',
      // }}
    >
      {messenger.unreadCount}
    </motion.div>
  )}
</div>

      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="user-menu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="absolute 
              rounded-xl 
              shadow-md
              min-w-[220px]
              max-w-[300px]
              w-[70vw]
              md:w-[240px]
              bg-white 
              overflow-hidden 
              right-0 
              top-14 
              text-sm"
          >
          <div className="flex flex-col cursor-pointer">
            {currentUser ? (
              <>
                {(userRole === 'customer' || userRole === 'promoter' || userRole === 'host' || userRole === 'moder') && (
                  <>
                    <MenuItem
                      label="Notifications"
                      icon={<AiOutlineBell size={18} />}
                      badgeCount={notificationFreshCount > 0 ? notificationFreshCount : undefined}
                      onClick={handleNotificationsOpen}
                    />
                    <MenuItem
                      label="Messenger"
                      onClick={() => {
                        setIsOpen(false);
                        if (messenger.isOpen) {
                          messenger.close();     // Close messenger if already open
                        } else {
                          messenger.openList();  // Open messenger if closed
                        }
                      }}
                      badgeCount={messenger.unreadCount > 0 ? messenger.unreadCount : undefined}
                    />

                    <hr className="my-2" />

                    {/* {userRole === 'host' && (
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
            Add Experience
          </div>
        )} */}
                  </>
                )}

                {userRole === 'customer' && (
                  <>
                    <MenuItem label="Appointments" onClick={() => {
                        setIsOpen(false);
                      }}
                      href="/trips"
                    />
                    <MenuItem label="Wishlist"
                      onClick={() => {
                        setIsOpen(false);
                      }}
                      href="/favorites"
                    />
                    <MenuItem
                      label="My Social Card"
                      onClick={() => {
                        setIsOpen(false);
                      }}
                      href="/social-card"
                    />
                    {(userRole === 'customer') && (
                        <>
                        <hr className="my-2" />
                          <MenuItem label="Account"
                            onClick={() => {
                              setIsOpen(false);
                            }}
                            href="/profile"
                          />
                          <hr className="my-2" />
                        </>
                      )}
                  </>
                )}

                {userRole === 'promoter' && (
                  <>
                    {/* Only render on mobile as MenuItems */}
                    <div className="md:hidden">
                      <MenuItem label="Vuola Passcode" 
                        onClick={() => {
                          setIsOpen(false);
                          onPromote();
                        }} />
                    </div>
                    
                    <MenuItem label="Appointments" 
                      onClick={() => {
                        setIsOpen(false);
                      }}
                      href="/trips"
                    />
                    <MenuItem label="Wishlist"
                      onClick={() => {
                        setIsOpen(false);
                      }}
                      href="/favorites"
                    />
                    {(userRole === 'promoter' || userRole === 'promoter' || userRole === 'host' || userRole === 'moder') && (
                        <>
                        <hr className="my-2" />
                          <MenuItem label="Dashboard"
                            onClick={() => {
                              setIsOpen(false);
                            }}
                            href="/profile"
                          />
                          <hr className="my-2" />
                        </>
                      )}
                  </>
                )}

                {userRole === 'host' && (
                  <>
                    <MenuItem
                      label="Become a Partner"
                      icon={<MdOutlineBusinessCenter size={24} />}
                      className="font-semibold text-neutral-900"
                      onClick={() => {
                        setIsOpen(false);
                        onRent();
                      }}
                    />
                    <hr className="my-2" />
                    <MenuItem label="Appointments"
                      onClick={() => {
                        setIsOpen(false);
                      }}
                      href="/trips"
                    />
                    <MenuItem label="Wishlist"
                      onClick={() => {
                        setIsOpen(false);
                      }}
                      href="/favorites"
                    />
                          <hr className="my-2" />
                    <MenuItem label="Bookings"
                      onClick={() => {
                        setIsOpen(false);
                      }}
                      href="/reservations"
                    />
                    <MenuItem label="My listings"
                      onClick={() => {
                        setIsOpen(false);
                      }}
                      href="/my-listings"
                    />
                    <MenuItem
                      label="Host Card"
                      onClick={() => {
                        setIsOpen(false);
                      }}
                      href={hostCardHref}
                    />
                    {(userRole === 'host') && (
                        <>
                          <MenuItem label="Dashboard"
                            onClick={() => {
                              setIsOpen(false);
                            }}
                            href="/profile"
                          />
                          <hr className="my-2" />
                        </>
                    )}
                  </>
                )}

                {userRole === 'moder' && (
                  <>
                    <div className="md:hidden">
                      {/* <MenuItem label="Add Experience"  onClick={() => {
                      setIsOpen(false);
                      onRent();
                    }} /> */}
                    <hr className="my-2" />
                    </div>
                    <MenuItem label="Appointments" 
                      onClick={() => {
                        setIsOpen(false);
                      }}
                      href="/trips"
                    />
                    <MenuItem label="Wishlist"
                      onClick={() => {
                        setIsOpen(false);
                      }}
                      href="/favorites"
                    />
                    {(userRole === 'moder') && (
                        <>
                          <MenuItem label="Account"
                            onClick={() => {
                              setIsOpen(false);
                            }}
                            href="/profile"
                          />
                          <hr className="my-2" />
                            <MenuItem label="Dashboard"
                            onClick={() => {
                              setIsOpen(false);
                            }}
                            href="/moderation"
                          />
                          <hr className="my-2" />
                        </>
                    )}
                  </>
                )}

                  <MenuItem label="Logout" onClick={() => {
                    setIsOpen(false);
                    signOut();
                  }} />
              </>
            ) : (
              <>
                  <MenuItem label="Login" onClick={() => {
                    setIsOpen(false);
                    loginModal.onOpen();
                  }} />
                <hr className="my-2" />
                  <MenuItem label="Sign up" 
                    onClick={() => {
                      setIsOpen(false);
                      registerModal.onOpen();
                    }} />

              </>
            )}
          </div>

          {showLocaleInMenu && (
            <div className="md:hidden border-t border-neutral-200 px-4 py-3">
              <LocaleButton />
            </div>
          )}

          </motion.div>
        )}
      </AnimatePresence>
      <NotificationsPanel isOpen={notificationsOpen} onClose={handleNotificationsClose} />
    </div>
  );
};

export default UserMenu;
