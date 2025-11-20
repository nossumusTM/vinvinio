'use client';

import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";
import { AnimatePresence, motion } from 'framer-motion';

import useFavorite from "@/app/(marketplace)/hooks/useFavorite";
import { SafeUser } from "@/app/(marketplace)/types";

import { MdBookmarkBorder } from "react-icons/md";
import { GoBookmark } from "react-icons/go";
import { GoBookmarkFill } from "react-icons/go";
import { TbBookmark } from "react-icons/tb";
import { TbBookmarkFilled } from "react-icons/tb";
import { LuBookmark } from "react-icons/lu";
import { RiBookmark3Line } from "react-icons/ri";
import { RiBookmark3Fill } from "react-icons/ri";

import ClientOnly from "./ClientOnly";

interface HeartButtonProps {
    listingId: string
    currentUser?: SafeUser | null
    inline?: boolean;
}

const HeartButton: React.FC<HeartButtonProps> = ({
  listingId,
  currentUser,
  inline = false,
}) => {
  const { hasFavorited, toggleFavorite } = useFavorite({
    listingId,
    currentUser,
  });

  return (
    <button
        type="button"
        onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(e as any);
        }}
        aria-label={hasFavorited ? 'Remove from favorites' : 'Save to favorites'}
        className={`
            p-4 rounded-full shadow-md backdrop-blur-sm transition hover:shadow-lg bg-white/50
            ${hasFavorited ? 'bg-white/20' : 'bg-white/10'}
            cursor-pointer flex items-center justify-center
        `}
        >
        <AnimatePresence mode="wait" initial={false}>
            {hasFavorited ? (
            <motion.span
                key="favorited"
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.4, opacity: 0 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
            >
                <RiBookmark3Fill size={18} className="text-white drop-shadow-md" />
            </motion.span>
            ) : (
            <motion.span
                key="unfavorited"
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.4, opacity: 0 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
            >
                <RiBookmark3Line size={18} className="text-white drop-shadow-md" />
            </motion.span>
            )}
        </AnimatePresence>
        </button>
  );
};


export default HeartButton;