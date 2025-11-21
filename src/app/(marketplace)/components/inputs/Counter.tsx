'use client';

import { useCallback } from "react";
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
    const onAdd = useCallback(() => {
        onChange(value + 1);
    }, [onChange, value]);

    const onReduce = useCallback(() => {
        if (value === 1) {
            return;
        }

        onChange(value - 1);
    }, [onChange, value]);

    return (
        <div className="flex flex-row items-center justify-between">
            <div className="flex flex-col">
                <div className="font-medium">{title}</div>
                <div className="font-light text-gray-600">
                    {subtitle}
                </div>
            </div>
            <div className="flex flex-row items-center gap-4">
                <div
                    onClick={onReduce}
                    className="
            w-10
            h-10
            rounded-full
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
                        className="font-normal text-xl text-neutral-600"
                        >
                        {value}
                        </motion.span>
                    </AnimatePresence>
                    </div>
                <div
                    onClick={onAdd}
                    className="
            w-10
            h-10
            rounded-full
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