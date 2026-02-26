'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const ListingSectionsNav: React.FC = () => {
  const [activeSectionId, setActiveSectionId] = useState('general-section');
  const navContainerRef = useRef<HTMLDivElement | null>(null);
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const sectionElementsRef = useRef<HTMLElement[]>([]);
  const suppressObserverUntilRef = useRef(0);

  const sectionNavItems = useMemo(
    () => [
      { id: 'general-section', label: 'General' },
      { id: 'overview-section', label: 'Overview' },
      { id: 'service-details-section', label: 'Service Details' },
      { id: 'about-service-section', label: 'About Service' },
      { id: 'service-format-section', label: 'Service Format' },
      { id: 'location-section', label: 'Location' },
      { id: 'reviews', label: 'Reviews' },
    ],
    [],
  );

  useEffect(() => {
    let observer: IntersectionObserver | null = null;

    const getSectionElements = () =>
      sectionNavItems
        .map((item) => document.getElementById(item.id))
        .filter((element): element is HTMLElement => Boolean(element));

    const resolveActiveByPosition = () => {
      if (Date.now() < suppressObserverUntilRef.current) return;
      const sectionElements = sectionElementsRef.current;
      if (sectionElements.length === 0) return;

      const anchorY = window.scrollY + 190;
      let nextActiveId = sectionElements[0].id;

      for (const section of sectionElements) {
        if (section.offsetTop <= anchorY) {
          nextActiveId = section.id;
        } else {
          break;
        }
      }

      setActiveSectionId((prev) => (prev === nextActiveId ? prev : nextActiveId));
    };

    const bindObserver = () => {
      const sectionElements = getSectionElements();
      if (sectionElements.length === 0) return false;

      sectionElementsRef.current = sectionElements;
      observer?.disconnect();
      observer = new IntersectionObserver(
        (entries) => {
          if (Date.now() < suppressObserverUntilRef.current) return;

          const visibleEntries = entries
            .filter((entry) => entry.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

          if (visibleEntries.length > 0) {
            setActiveSectionId(visibleEntries[0].target.id);
            return;
          }

          resolveActiveByPosition();
        },
        {
          root: null,
          rootMargin: '-18% 0px -62% 0px',
          threshold: [0.05, 0.15, 0.35, 0.6],
        },
      );

      sectionElements.forEach((element) => observer?.observe(element));
      resolveActiveByPosition();
      return true;
    };

    const bindInterval = window.setInterval(() => {
      if (bindObserver()) {
        window.clearInterval(bindInterval);
      }
    }, 250);

    window.setTimeout(() => window.clearInterval(bindInterval), 6000);
    bindObserver();
    window.addEventListener('scroll', resolveActiveByPosition, { passive: true });
    window.addEventListener('resize', resolveActiveByPosition);

    return () => {
      observer?.disconnect();
      window.clearInterval(bindInterval);
      window.removeEventListener('scroll', resolveActiveByPosition);
      window.removeEventListener('resize', resolveActiveByPosition);
    };
  }, [sectionNavItems]);

  useEffect(() => {
    const button = buttonRefs.current[activeSectionId];
    const container = navContainerRef.current;
    if (!button || !container) return;

    const targetLeft = button.offsetLeft - container.clientWidth / 2 + button.clientWidth / 2;
    container.scrollTo({ left: Math.max(0, targetLeft), behavior: 'smooth' });
  }, [activeSectionId]);

  const handleSectionNavClick = useCallback((sectionId: string) => {
    const target = document.getElementById(sectionId);
    if (!target) return;

    suppressObserverUntilRef.current = Date.now() + 900;
    setActiveSectionId(sectionId);

    const button = buttonRefs.current[sectionId];
    const container = navContainerRef.current;
    if (button && container) {
      const targetLeft = button.offsetLeft - container.clientWidth / 2 + button.clientWidth / 2;
      container.scrollTo({ left: Math.max(0, targetLeft), behavior: 'smooth' });
    }

    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  return (
    <div className="flex justify-center px-2 pb-2 pt-1">
      <div
        ref={navContainerRef}
        className="max-w-[calc(100vw-1.5rem)] overflow-x-auto overflow-y-hidden rounded-2xl shadow-lg p-2 shadow-sm"
      >
        <div className="inline-flex w-max items-center gap-2">
          {sectionNavItems.map((item) => {
            const isActive = activeSectionId === item.id;
            return (
              <button
                key={item.id}
                ref={(node) => {
                  buttonRefs.current[item.id] = node;
                }}
                type="button"
                onClick={() => handleSectionNavClick(item.id)}
                className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition ${
                  isActive ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ListingSectionsNav;
