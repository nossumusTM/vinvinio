'use client';

import axios from 'axios';
import { useCallback, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

import useLoginModal from './useLoginModal';
import { SafeUser } from '../types';

interface UseListingLikeProps {
  listingId: string;
  currentUser?: SafeUser | null;
  initialLikesCount?: number;
  isInitiallyLiked?: boolean;
}

const useListingLike = ({
  listingId,
  currentUser,
  initialLikesCount = 0,
  isInitiallyLiked = false,
}: UseListingLikeProps) => {
  const router = useRouter();
  const loginModal = useLoginModal();
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [liked, setLiked] = useState(isInitiallyLiked);
  const [loading, setLoading] = useState(false);

  const toggleLike = useCallback(async (e?: React.MouseEvent<HTMLDivElement | HTMLButtonElement>) => {
    e?.stopPropagation?.();

    if (!currentUser) {
      loginModal.onOpen();
      return;
    }

    setLoading(true);

    try {
      const response = liked
        ? await axios.delete(`/api/listings/${listingId}/like`)
        : await axios.post(`/api/listings/${listingId}/like`);

      const nextLikes = typeof response.data?.likesCount === 'number'
        ? response.data.likesCount
        : liked
          ? Math.max(0, likesCount - 1)
          : likesCount + 1;

      setLiked((prev) => !prev);
      setLikesCount(nextLikes);
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error('Unable to update like.');
    } finally {
      setLoading(false);
    }
  }, [currentUser, liked, likesCount, listingId, loginModal, router]);

  return {
    liked,
    likesCount,
    loading,
    toggleLike,
  };
};

export default useListingLike;