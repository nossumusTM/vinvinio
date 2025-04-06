'use client';

import { useEffect, useState, useMemo } from "react";
import { IoMdClose } from "react-icons/io";
import Avatar from "../Avatar"; // ✅ Ensure this is correctly imported

interface ReviewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  reviews: {
    rating: number;
    comment: string;
    userName: string;
    userImage?: string;
    createdAt: string;
  }[];
}

const ReviewsModal: React.FC<ReviewsModalProps> = ({
  isOpen,
  onClose,

  reviews
}) => {
  const [showModal, setShowModal] = useState(isOpen);

  useEffect(() => {
    setShowModal(isOpen);
  }, [isOpen]);

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;
         const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return total / reviews.length;
  }, [reviews]);  

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-lg relative max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center border-b pb-4 mb-4">
        {/* Overall Rating */}
        <div className="flex items-center gap-2">
            {/* SVG Star with partial fill */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <defs>
                <linearGradient id="starGradient">
                    <stop offset={`${(averageRating / 5) * 100}%`} stopColor="black" />
                    <stop offset={`${(averageRating / 5) * 100}%`} stopColor="lightgray" />
                </linearGradient>
                </defs>
                <path
                fill="url(#starGradient)"
                d="M12 17.27L18.18 21 16.54 13.97 22 9.24 
                    14.81 8.63 12 2 9.19 8.63 2 9.24 
                    7.46 13.97 5.82 21 12 17.27z"
                />
                </svg>

            {/* Rating and count */}
            <span className="text-xl text-neutral-700 font-bold">
                {averageRating.toFixed(1)} · {reviews.length} review{reviews.length !== 1 ? 's' : ''}
            </span>
        </div>
          <button onClick={onClose} className="hover:opacity-70 transition">
            <IoMdClose size={24} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reviews.map((review, i) => (
            <div
              key={i}
              className="border border-neutral-200 rounded-2xl p-4 shadow-sm hover:shadow-md"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={`text-lg ${
                      star <= review.rating ? "text-black" : "text-gray-300"
                    }`}
                  >
                    ★
                  </span>
                ))}
              </div>

              {/* Comment */}
              <p className="italic text-neutral-700">“{review.comment}”</p>

              {/* User info */}
              <div className="flex items-center gap-3 mt-4">
                {review.userImage && (
                  <Avatar
                    src={review.userImage}
                    name={review.userName}
                  />
                )}
                <div>
                  <p className="text-sm font-semibold text-neutral-800">
                    {review.userName}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReviewsModal;