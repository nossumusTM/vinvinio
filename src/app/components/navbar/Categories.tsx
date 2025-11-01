'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import CategoryBox from '../CategoryBox';
import Container from '../Container';

import { useCallback, useEffect, useRef, useState } from 'react';
import { LuChevronUp } from 'react-icons/lu';

declare global {
  interface WindowEventMap {
    'categories:open': CustomEvent<void>;
  }
}

export const categories = [
  {
    label: 'La Bella Tour',
    icon: '/icons/animated/la-bella-tour.svg',
    description: 'Aventine Hill Tour in Vintage Fiat 500 Convoy',
  },
  {
    label: 'Production',
    icon: '/icons/animated/production.svg',
    description: 'Capture the timeless beauty of the most iconic landmarks',
  },
  {
    label: 'Viva Vespa!',
    icon: '/icons/animated/viva-vespa.svg',
    description: 'Vespa Sidecar Tour with pickup and drop-off',
  },
  {
    label: 'La Moda',
    icon: '/icons/animated/la-moda.svg',
    description: 'Discover Italy’s finest fashion and artisanal treasures on an exclusive shopping tour.',
  },
  {
    label: 'Cooking Class',
    icon: '/icons/animated/cooking-class.svg',
    description: 'Guided food and wine journeys crafted for curious palates.',
  },
  {
    label: 'Walking Art',
    icon: '/icons/animated/walking-art.svg',
    description: "Experience the city's heartbeat through stories hidden in plain sight.",
  },
];

const Categories = () => {
  const params = useSearchParams();
  const category = params?.get('category');
  const pathname = usePathname();
  const isMainPage = pathname === '/';
  const [visible, setVisible] = useState(true);
  const [autoScrollPaused, setAutoScrollPaused] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const resumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const pauseAutoScroll = useCallback(() => {
    setAutoScrollPaused(true);
    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current);
      resumeTimeoutRef.current = null;
    }
  }, []);

  const scheduleAutoScrollResume = useCallback(() => {
    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current);
    }
    resumeTimeoutRef.current = setTimeout(() => {
      setAutoScrollPaused(false);
    }, 3500);
  }, []);

  const handleInteractionStart = useCallback(() => {
    pauseAutoScroll();
  }, [pauseAutoScroll]);

  const handleInteractionEnd = useCallback(() => {
    scheduleAutoScrollResume();
  }, [scheduleAutoScrollResume]);

  useEffect(() => () => {
    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current);
    }
  }, []);

  useEffect(() => {
    if (autoScrollPaused) return;

    let frameId: number;
    const step = () => {
      const container = scrollContainerRef.current;
      if (!container) {
        frameId = requestAnimationFrame(step);
        return;
      }

      if (container.scrollWidth <= container.clientWidth + 4) {
        return;
      }

      container.scrollLeft += 0.35;
      if (container.scrollLeft >= container.scrollWidth - container.clientWidth - 1) {
        container.scrollLeft = 0;
      }

      frameId = requestAnimationFrame(step);
    };

    frameId = requestAnimationFrame(step);

    return () => cancelAnimationFrame(frameId);
  }, [autoScrollPaused]);

  useEffect(() => {
    setVisible(!category);
  }, [category]);

  useEffect(() => {
    const handleOpen = () => setVisible(true);

    window.addEventListener('categories:open', handleOpen);

    return () => {
      window.removeEventListener('categories:open', handleOpen);
    };
  }, []);

  useEffect(() => {
    let timeout: NodeJS.Timeout | null = null;
    let lastScrollY = window.scrollY;
    let hasScrolledDown = false;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDelta = currentScrollY - lastScrollY;

      if (scrollDelta > 10) {
        hasScrolledDown = true;
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => {
          setVisible(false);
        }, 100);
      }

      if (currentScrollY <= 50 && hasScrolledDown) {
        if (timeout) clearTimeout(timeout);
        setVisible(true);
        hasScrolledDown = false;
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      if (timeout) clearTimeout(timeout);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  if (!isMainPage) {
    return null;
  }

  return (
    <div className="relative w-full">
      <AnimatePresence initial={false}>
        {visible && (
          <motion.div
            key="categories"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className={clsx('relative z-0 overflow-hidden', !visible && 'pointer-events-none')}
          >
            <Container>
              <div
                ref={scrollContainerRef}
                className="flex w-full snap-x snap-mandatory flex-row items-center gap-2 overflow-x-auto pt-4 scroll-smooth scrollbar-thin sm:w-auto"
                onMouseDown={handleInteractionStart}
                onMouseUp={handleInteractionEnd}
                onMouseLeave={handleInteractionEnd}
                onTouchStart={handleInteractionStart}
                onTouchEnd={handleInteractionEnd}
                onWheel={() => {
                  handleInteractionStart();
                  scheduleAutoScrollResume();
                }}
              >
                {categories.map((item) => (
                  <CategoryBox
                    key={item.label}
                    label={item.label}
                    icon={item.icon}
                    description={item.description}
                    selected={category === item.label}
                  />
                ))}
              </div>
            </Container>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setVisible((prev) => !prev)}
        className="absolute bottom-[-12px] left-1/2 z-10 -translate-x-1/2 rounded-full bg-white p-1 shadow-md transition-transform duration-300"
        aria-label={visible ? 'Collapse categories' : 'Expand categories'}
      >
        <motion.div animate={{ rotate: visible ? 0 : 180 }} transition={{ duration: 0.3 }}>
          <LuChevronUp size={15} strokeWidth={3} className="text-black" />
        </motion.div>
      </button>
    </div>
  );
};

export default Categories;
