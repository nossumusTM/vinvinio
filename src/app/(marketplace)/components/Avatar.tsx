'use client';

import Image from "next/image";
import { ReactNode } from 'react';
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
  fallbackIcon?: ReactNode;
}

const Avatar: React.FC<AvatarProps> = ({ src, name = 'U', size = 40, fallbackIcon }) => {
  const initials = name?.[0]?.toUpperCase() || 'U';

  return src ? (
    <Image
      src={src}
      alt={name || 'Avatar'}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      className="rounded-full object-cover shadow-md"
    />
  ) : (
    <div
      className="flex items-center justify-center rounded-full text-white font-medium bg-black"
      style={{
        width: size,
        height: size,
        fontSize: `${size * 0.5}px`,
        background: '#2200ffff'
        // background: 'linear-gradient(135deg, #3d08ff, #04aaff, #3604ff, #0066ff, #3d08ff)',
      }}
    >
      {fallbackIcon || initials}
    </div>
  );
};

export default Avatar;
