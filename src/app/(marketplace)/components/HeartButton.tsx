'use client';

import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";

import useFavorite from "@/app/(marketplace)/hooks/useFavorite";
import { SafeUser } from "@/app/(marketplace)/types";

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
        currentUser
    });

    // return (
    //     <div
    //         onClick={toggleFavorite}
    //         className="
    //     relative
    //     hover:opacity-80
    //     transition
    //     cursor-pointer
    //   "
    //     >
    //         <AiOutlineHeart
    //             size={28}
    //             className="
    //       fill-white
    //       absolute
    //       -top-[2px]
    //       -right-[2px]
    //     "
    //         />
    //         <AiFillHeart
    //             size={24}
    //             className={
    //                 hasFavorited ? 'fill-[#3604ff]' : 'fill-transparent'
    //             }
    //         />
    //     </div>
    // );

    return (
        <div
            onClick={toggleFavorite}
            className={`${inline ? 'static relative' : 'absolute top-3 right-3'} top-1 right-1 z-30 cursor-pointer"`}
        >
            <div
            className={`
                p-2 rounded-full backdrop-blur-sm transition hover:shadow-md 
                ${hasFavorited ? 'bg-white/20' : 'bg-white/10'}
            `}
            >
            {hasFavorited ? (
                <AiFillHeart size={18} className="text-white drop-shadow-md" />
            ) : (
                <AiOutlineHeart size={18} className="text-white drop-shadow-md" />
            )}
            </div>
        </div>
    );
}

export default HeartButton;