// ShareButton.tsx
'use client';

import { PiShareFat } from 'react-icons/pi';
import { FaRegShareFromSquare } from "react-icons/fa6";
import { RiShareForwardLine } from "react-icons/ri";
import { motion } from 'framer-motion';
import clsx from 'clsx';

interface ShareButtonProps {
  onClick: () => void;
  inline?: boolean;
}

const ShareButton: React.FC<ShareButtonProps> = ({ onClick, inline = false }) => {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-label="Share"
      className={clsx(
        'p-4 rounded-full bg-white/10 backdrop-blur-sm text-white shadow-md',
        'flex items-center justify-center transition hover:shadow-lg',
        inline ? 'static' : 'absolute top-3 right-3'
      )}
    >
      <motion.span
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        whileTap={{ scale: 0.85 }}
      >
        <RiShareForwardLine size={18} />
      </motion.span>
    </button>
  );
};

export default ShareButton;