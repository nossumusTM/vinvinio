'use client';

import { AiFillHeart, AiOutlineHeart } from 'react-icons/ai';
import { AiOutlineLike, AiFillLike } from "react-icons/ai";
import { AnimatePresence, motion } from 'framer-motion';
import clsx from 'clsx';

import useListingLike from '../../hooks/useListingLike';
import { SafeUser } from '../../types';

interface ListingLikeButtonProps {
  listingId: string;
  currentUser?: SafeUser | null;
  initialLikesCount?: number;
  isInitiallyLiked?: boolean;
  inline?: boolean;
}

const ListingLikeButton: React.FC<ListingLikeButtonProps> = ({
  listingId,
  currentUser,
  initialLikesCount = 0,
  isInitiallyLiked = false,
  inline = false,
}) => {
  const { liked, likesCount, toggleLike, loading } = useListingLike({
    listingId,
    currentUser,
    initialLikesCount,
    isInitiallyLiked,
  });

  const handleIconClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (loading) return;
    toggleLike();
  };

  return (
    <div
      className={clsx(
        'bg-black/10 group flex items-center gap-2 rounded-full backdrop-blur-sm transition px-3 py-1.5 text-white shadow-md backdrop-blur transition',
        'hover:shadow-lg',
        inline ? 'static' : 'absolute top-3 right-3'
      )}
    >
      {/* Only the heart button actually toggles the like */}
      <button
        type="button"
        onClick={handleIconClick}
        disabled={loading}
        className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 disabled:cursor-not-allowed disabled:opacity-70"
        aria-label={liked ? 'Unlike listing' : 'Like listing'}
      >
        <AnimatePresence mode="wait" initial={false}>
          {liked ? (
            <motion.span
              key="liked"
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.4, opacity: 0 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
            >
              <AiFillLike size={18} className="text-white drop-shadow-md" />
            </motion.span>
          ) : (
            <motion.span
              key="unliked"
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.4, opacity: 0 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
            >
              <AiOutlineLike size={18} className="text-white drop-shadow-md" />
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* Clicking on the number no longer toggles anything */}
      <span className="text-sm font-semibold select-none">{likesCount}</span>
    </div>
  );
};

export default ListingLikeButton;
