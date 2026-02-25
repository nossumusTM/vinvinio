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
import { FaRegBookmark } from "react-icons/fa";
import { FaBookmark } from "react-icons/fa";

import ClientOnly from "./ClientOnly";

interface HeartButtonProps {
    listingId: string
    currentUser?: SafeUser | null
    inline?: boolean;
    buttonClassName?: string;
    iconClassName?: string;
}

const HeartButton: React.FC<HeartButtonProps> = ({
  listingId,
  currentUser,
  inline = false,
  buttonClassName = '',
  iconClassName = '',
}) => {
  const { hasFavorited, toggleFavorite } = useFavorite({
    listingId,
    currentUser,
  });
  const defaultButtonStyles = 'shadow-md hover:shadow-lg bg-white';

  return (
    <button
        type="button"
        onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(e as any);
        }}
        aria-label={hasFavorited ? 'Remove from favorites' : 'Save to favorites'}
        className={`
            p-3 rounded-full transition
            ${buttonClassName || defaultButtonStyles}
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
                <FaBookmark size={14} className={`text-black drop-shadow-md ${iconClassName}`} />
            </motion.span>
            ) : (
            <motion.span
                key="unfavorited"
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.4, opacity: 0 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
            >
                <FaRegBookmark size={14} className={`text-black drop-shadow-md ${iconClassName}`} />
            </motion.span>
            )}
        </AnimatePresence>
        </button>
  );
};


export default HeartButton;
