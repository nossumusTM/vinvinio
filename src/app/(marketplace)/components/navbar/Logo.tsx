'use client';

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import useSearchExperienceModal from "@/app/(marketplace)/hooks/useSearchExperienceModal";
import { AI_FORCE_ASSISTANT } from "@/app/(marketplace)/hooks/useVinAiChat";
import useMessenger from "@/app/(marketplace)/hooks/useMessager";
import { RiSpaceShipFill } from "react-icons/ri";
import { TiRefreshOutline } from "react-icons/ti";
import { TbLayoutBottombarCollapseFilled } from "react-icons/tb";
import { HiMap } from "react-icons/hi";
import { useRouter } from 'next/navigation';

const Logo = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const messenger = useMessenger();
  const searchModal = useSearchExperienceModal();
  const router = useRouter();

  useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (containerRef.current.contains(event.target as Node)) return;
      setIsMenuOpen(false);
    };

    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const handleAskForceAi = () => {
    messenger.openChat(AI_FORCE_ASSISTANT);
    setIsMenuOpen(false);
  };

  const handleRefresh = () => {
    router.push('/');
    router.refresh();
  };

  const handleOpenMap = () => {
    window.dispatchEvent(new CustomEvent('listings-map:open'));
    setIsMenuOpen(false);
  };

  return (
  <div ref={containerRef} className="relative z-[200] flex items-center justify-center">
    {/* Anchor wrapper: menu positions relative to this */}
    <div className="relative inline-flex items-center justify-center">
      <button
        type="button"
        onClick={() => setIsMenuOpen((prev) => !prev)}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        className="group relative cursor-pointer rounded-full p-1 transition"
        aria-label="Open quick actions menu"
      >
        {/* Desktop Logo (shown on md and up) */}
        <Image
          src="/images/vinvinlogo2.png"
          alt="Vuola Logo Desktop"
          width={30}
          height={30}
          priority
          className={`hidden md:block transition-transform duration-300 ${
            isMenuOpen || isHovering ? 'rotate-6 scale-110' : 'rotate-0 scale-100'
          }`}
        />

        {/* Mobile Logo (shown below md breakpoint) */}
        <Image
          src="/images/vinvinlogo2.png"
          alt="Vuola Logo Mobile"
          width={30}
          height={30}
          priority
                  className={`block md:hidden mr-1 transition-transform duration-300 ${
            isMenuOpen || isHovering ? 'rotate-6 scale-110' : 'rotate-0 scale-100'
          }`}
        />
      </button>

      <AnimatePresence>
        {isHovering && !isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-none absolute -bottom-[-2] -translate-x-1/2
                      rounded-full bg-black/80 px-2 py-0.5 text-[10px]
                      font-medium tracking-wide text-white backdrop-blur"
          >
            vinvin.io
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isMenuOpen && (
          <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2
                          md:left-1/2 md:top-auto md:top-full md:ml-0
                          md:-translate-x-1/2 md:-translate-y-0
                          z-[50000]">
            <motion.div
              key="logo-menu"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2 rounded-full border border-neutral-200 bg-gradient-to-b from-white/95 via-white/90 to-slate-100/90 px-3 py-2 shadow-[0_18px_35px_rgba(15,23,42,0.18)] backdrop-blur"
            >
            {/* AI */}
            <button
              type="button"
              onClick={handleAskForceAi}
              className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white/90 px-3 py-1.5 text-xs font-semibold text-neutral-700 shadow-sm transition hover:border-neutral-300"
              aria-label="AI"
            >
              <RiSpaceShipFill className="h-4 w-4" />
              <span>AI</span>
            </button>

            {/* Refresh */}
            <button
              type="button"
              onClick={handleRefresh}
              className="flex items-center gap-2 rounded-full border border-neutral-200 bg-black/90 px-3 py-1.5 text-xs font-semibold text-neutral-100 shadow-sm transition hover:border-neutral-300"
              aria-label="Refresh"
            >
              <TbLayoutBottombarCollapseFilled className="h-4 w-4" />
              <span>Main</span>
            </button>

            {/* Map */}
            <button
              type="button"
              onClick={handleOpenMap}
              className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white/90 px-3 py-1.5 text-xs font-semibold text-neutral-700 shadow-sm transition hover:border-neutral-300"
              aria-label="Map"
            >
              <HiMap className="h-4 w-4" />
              <span>Map</span>
            </button>
          </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  </div>
  );

};

export default Logo;