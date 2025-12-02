// TimePicker.tsx
'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RiArrowDownSFill } from "react-icons/ri";

interface TimePickerProps {
  value: string; // "HH:MM"
  onChange: (value: string) => void;
  placement?: 'up' | 'down';
  minuteStep?: number; // default 5
}

const TimePicker: React.FC<TimePickerProps> = ({
  value,
  onChange,
  placement = 'down',
  minuteStep = 5,
}) => {
  const [isHourOpen, setIsHourOpen] = useState(false);
  const [isMinuteOpen, setIsMinuteOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const hourListRef = useRef<HTMLDivElement | null>(null);
  const minuteListRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setIsHourOpen(false);
        setIsMinuteOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const [hour, minute] = useMemo(() => {
    const [h, m] = (value || '00:00').split(':');
    const safeH = Number.isFinite(Number(h)) ? String(Number(h)).padStart(2, '0') : '00';
    const safeM = Number.isFinite(Number(m)) ? String(Number(m)).padStart(2, '0') : '00';
    return [safeH, safeM];
  }, [value]);

  const hours = useMemo(
    () => Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')),
    [],
  );

  const minutes = useMemo(
    () =>
      Array.from(
        { length: Math.floor(60 / minuteStep) },
        (_, i) => String(i * minuteStep).padStart(2, '0'),
      ),
    [minuteStep],
  );

  const dropdownPositionClass =
    placement === 'up'
      ? 'bottom-[calc(100%+8px)] origin-bottom'
      : 'top-[calc(100%+8px)] origin-top';

  const handleHourChange = (newHour: string) => {
    onChange(`${newHour}:${minute}`);
    setIsHourOpen(false);
    setIsMinuteOpen(false);
  };

  const handleMinuteChange = (newMinute: string) => {
    onChange(`${hour}:${newMinute}`);
    setIsMinuteOpen(false);
    setIsHourOpen(false);
  };

  useEffect(() => {
    if (!isHourOpen || !hourListRef.current) return;
    const active = hourListRef.current.querySelector<HTMLButtonElement>('[data-active="true"]');
    if (active) {
      active.scrollIntoView({ block: 'nearest' });
    }
  }, [isHourOpen, hour]);

  useEffect(() => {
    if (!isMinuteOpen || !minuteListRef.current) return;
    const active = minuteListRef.current.querySelector<HTMLButtonElement>('[data-active="true"]');
    if (active) {
      active.scrollIntoView({ block: 'nearest' });
    }
  }, [isMinuteOpen, minute]);

  const dropdownMotion = {
    initial: {
      opacity: 0,
      y: placement === 'up' ? 8 : -8,
      scale: 0.98,
    },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
    },
    exit: {
      opacity: 0,
      y: placement === 'up' ? 8 : -8,
      scale: 0.98,
    },
  } as const;

  return (
    <div ref={containerRef} className="flex flex-row gap-3">
      {/* Hour */}
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setIsHourOpen((prev) => !prev);
            setIsMinuteOpen(false);
          }}
          className="flex w-full items-center justify-center gap-1 rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-900"
        >
          <span>{hour}</span>
           <RiArrowDownSFill className="h-4 w-4 text-neutral-500" />
        </button>

        <AnimatePresence>
          {isHourOpen && (
            <motion.div
              key="hour-dropdown"
              initial={dropdownMotion.initial}
              ref={hourListRef}
              animate={dropdownMotion.animate}
              exit={dropdownMotion.exit}
              transition={{ duration: 0.15 }}
               className={`
                absolute
                ${dropdownPositionClass}
                left-0
                z-20
                w-full
                rounded-2xl
                border border-neutral-200
                bg-white
                shadow-lg
                max-h-60
                overflow-y-auto
              `}
            >
              {hours.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => handleHourChange(h)}
                  className={`block w-full px-3 py-2 text-left text-sm hover:bg-neutral-100 ${
                    h === hour ? 'bg-neutral-50 font-semibold' : ''
                  }`}
                  data-active={h === hour || undefined}
                >
                  {h}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Minute */}
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setIsMinuteOpen((prev) => !prev);
            setIsHourOpen(false);
          }}
          className="flex w-full gap-1 items-center justify-center rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-900"
        >
          <span>{minute}</span>
            <RiArrowDownSFill className="h-4 w-4 text-neutral-500" />
        </button>

        <AnimatePresence>
          {isMinuteOpen && (
            <motion.div
              key="minute-dropdown"
              ref={minuteListRef}
              initial={dropdownMotion.initial}
              animate={dropdownMotion.animate}
              exit={dropdownMotion.exit}
              transition={{ duration: 0.15 }}
               className={`
                absolute
                ${dropdownPositionClass}
                left-0
                z-20
                w-full
                rounded-2xl
                border border-neutral-200
                bg-white
                shadow-lg
                max-h-60
                overflow-y-auto
              `}
            >
              {minutes.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleMinuteChange(m)}
                  data-active={m === minute || undefined}
                  className={`block w-full px-3 py-2 text-left text-sm hover:bg-neutral-100 ${
                    m === minute ? 'bg-neutral-50 font-semibold' : ''
                  }`}
                >
                  {m}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TimePicker;
