'use client';

import { useCallback, useEffect, useRef, useState } from "react";
import { AiOutlineMinus, AiOutlinePlus } from "react-icons/ai";
import { AnimatePresence, motion } from 'framer-motion';

interface CounterProps {
    title: string;
    subtitle: string;
    value: number;
    onChange: (value: number) => void;
    enableManualInput?: boolean;
}

const Counter: React.FC<CounterProps> = ({
    title,
    subtitle,
    value,
    onChange,
    enableManualInput = false,
}) => {
      const valueRef = useRef(value);
      const [isEditing, setIsEditing] = useState(false);
      const [draftValue, setDraftValue] = useState(String(value));
  useEffect(() => {
    valueRef.current = value;
    if (!isEditing) {
      setDraftValue(String(value));
    }
  }, [value]);

  const holdIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const changeBy = useCallback(
    (delta: number) => {
      const current = valueRef.current;
      const next = Math.max(1, current + delta);

      // stop if no change (prevents spam at 1)
      if (next === current) return;

      // IMPORTANT: update ref immediately so repeats don't "skip"
      valueRef.current = next;

      onChange(next);
    },
    [onChange],
  );

  const stepOnce = useCallback(
    (delta: number) => {
      const current = valueRef.current;
      if (delta < 0 && current <= 1) return;

      const next = current + delta;
      valueRef.current = next;
      onChange(next);
    },
    [onChange],
  );

  const stopAutoChange = useCallback(() => {
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (holdIntervalRef.current) {
        clearInterval(holdIntervalRef.current);
      }
      if (holdTimeoutRef.current) {
        clearTimeout(holdTimeoutRef.current);
      }
    };
  }, []);

  const commitDraft = useCallback(() => {
      const parsed = Math.round(Number(draftValue));
      if (Number.isFinite(parsed) && parsed >= 1) {
        onChange(parsed);
      }
      setIsEditing(false);
      setDraftValue(String(valueRef.current));
    }, [draftValue, onChange]);

  return (
     <div className="flex flex-col md:flex-row items-baseline justify-between">
        <div className="flex flex-col">
            <div className="font-medium">{title}</div>
            <div className="font-light text-gray-600">
                {subtitle}
            </div>
        </div>
        <div className="flex flex-row items-center gap-4">
          <div
          onClick={() => stepOnce(-1)}
          className="
            w-10
            h-10
            rounded-xl
            shadow-lg
            flex
            items-center
            justify-center
            text-neutral-600
            cursor-pointer
            hover:opacity-80
            transition
          "
                >
                    <AiOutlineMinus />
                </div>
                <div className="relative flex min-h-[20px] min-w-[20px] select-none items-center justify-center">
                  {enableManualInput && isEditing ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={1}
                        step={1}
                        value={draftValue}
                        onChange={(event) => setDraftValue(event.target.value)}
                        onBlur={commitDraft}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            event.preventDefault();
                            commitDraft();
                          }
                          if (event.key === 'Escape') {
                            event.preventDefault();
                            setIsEditing(false);
                            setDraftValue(String(valueRef.current));
                          }
                        }}
                        className="w-12 rounded-md border border-neutral-200 px-1 py-0.5 text-center text-xs text-neutral-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                        autoFocus
                      />
                      <button
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={commitDraft}
                        className="rounded-md bg-neutral-900 px-2 py-1 text-[10px] font-semibold text-white shadow-sm"
                      >
                        OK
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        if (!enableManualInput) return;
                        setDraftValue(String(valueRef.current));
                        setIsEditing(true);
                      }}
                      className={enableManualInput ? 'cursor-pointer' : 'cursor-default'}
                      aria-label={enableManualInput ? 'Edit count' : undefined}
                    >
                      <AnimatePresence mode="popLayout" initial={false}>
                        <motion.span
                          key={value}
                          initial={{ y: 8, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ y: -8, opacity: 0 }}
                          transition={{ duration: 0.18 }}
                          className="font-normal text-sm text-neutral-600"
                        >
                          {value}
                        </motion.span>
                      </AnimatePresence>
                    </button>
                  )}
                </div>
        <div
          onClick={() => stepOnce(1)}
          className="
            w-10
            h-10
            rounded-xl
            shadow-lg
            flex
            items-center
            justify-center
            text-neutral-600
            cursor-pointer
            hover:opacity-80
            transition
          "
                >
                    <AiOutlinePlus />
                </div>
            </div>
        </div>
    );
}

export default Counter;