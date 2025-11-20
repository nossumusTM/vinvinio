'use client';

import { AiFillHeart, AiOutlineHeart } from 'react-icons/ai';
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

  return (
    <button
      type="button"
      onClick={toggleLike}
      disabled={loading}
      className={clsx(
        'group flex items-center gap-2 rounded-full bg-black/50 px-3 py-2 text-white shadow-lg backdrop-blur transition',
        'hover:bg-black/60 disabled:cursor-not-allowed disabled:opacity-70',
        inline ? 'static' : 'absolute top-3 right-3'
      )}
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20">
        {liked ? (
          <AiFillHeart size={18} className="text-white drop-shadow-md" />
        ) : (
          <AiOutlineHeart size={18} className="text-white drop-shadow-md" />
        )}
      </span>
      <span className="text-sm font-semibold">{likesCount}</span>
    </button>
  );
};

export default ListingLikeButton;