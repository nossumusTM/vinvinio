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
      className="flex items-center justify-center rounded-full text-white font-bold bg-black"
      style={{
        width: size,
        height: size,
        fontSize: `${size * 0.5}px`,
        // background: 'linear-gradient(135deg, #08e2ff, #04aaff, #3604ff, #6adcff, #ffffff)',
      }}
    >
      {initials}
    </div>
  );
};

export default Avatar;
