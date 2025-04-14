'use client';

import Image from "next/image";
import { twMerge } from "tailwind-merge";

const getRandomColor = () => {
  const colors = [
    'bg-[#08e2ff]'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: number; // Optional: default is 40
}

const Avatar: React.FC<AvatarProps> = ({ src, name = 'U', size = 40 }) => {
  const initials = name?.[0]?.toUpperCase() || 'U';

  return src ? (
    <Image
      src={src}
      alt={name || 'Avatar'}
      width={size}
      height={size}
      className="rounded-full object-cover"
    />
  ) : (
    <div
      className={twMerge(
        "flex items-center justify-center rounded-full text-white font-bold",
        getRandomColor()
      )}
      style={{
        width: size,
        height: size,
        fontSize: `${size * 0.5}px`,
      }}
    >
      {initials}
    </div>
  );
};

export default Avatar;
