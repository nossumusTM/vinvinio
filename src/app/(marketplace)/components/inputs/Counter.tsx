'use client';

import { useCallback, useEffect, useRef } from "react";
import { AiOutlineMinus, AiOutlinePlus } from "react-icons/ai";
import { AnimatePresence, motion } from 'framer-motion';

interface CounterProps {
    title: string;
    subtitle: string;
    value: number;
    onChange: (value: number) => void;
}

const Counter: React.FC<CounterProps> = ({
    title,
    subtitle,
    value,
    onChange,
}) => {
      const valueRef = useRef(value);
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const holdIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const changeBy = useCallback(
    (delta: number) => {
      const current = valueRef.current;
      if (delta < 0 && current <= 1) return;
      onChange(current + delta);
    },
    [onChange],
  );

  const startAutoChange = useCallback(
    (delta: number) => {
      // clear existing interval if any
      if (holdIntervalRef.current) {
        clearInterval(holdIntervalRef.current);
      }

      // immediate step
      changeBy(delta);

      // continuous steps while held
      holdIntervalRef.current = setInterval(() => {
        changeBy(delta);
      }, 120);
    },
    [changeBy],
  );

  const stopAutoChange = useCallback(() => {
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (holdIntervalRef.current) {
        clearInterval(holdIntervalRef.current);
      }
    };
  }, []);

    return (
        <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex flex-col">
                <div className="font-medium">{title}</div>
                <div className="font-light text-gray-600">
                    {subtitle}
                </div>
            </div>
            <div className="flex flex-row items-center gap-4">
                <div
            onMouseDown={(e) => { e.preventDefault(); startAutoChange(-1); }}
            onMouseUp={stopAutoChange}
            onMouseLeave={stopAutoChange}
            onTouchStart={(e) => { e.preventDefault(); startAutoChange(-1); }}
            onTouchEnd={stopAutoChange}
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
                <div className="relative flex h-5 w-5 select-none items-center justify-center overflow-hidden">
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
                    </div>
        <div
            onMouseDown={(e) => { e.preventDefault(); startAutoChange(1); }}
            onMouseUp={stopAutoChange}
            onMouseLeave={stopAutoChange}
            onTouchStart={(e) => { e.preventDefault(); startAutoChange(1); }}
            onTouchEnd={stopAutoChange}
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