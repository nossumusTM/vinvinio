'use client';

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const LocationDescription: React.FC<{ text: string }> = ({ text }) => {
  const [expanded, setExpanded] = useState(false);
  const words = text.split(' ');
  const shortText = words.slice(0, 34).join(' ');
  const extraText = words.slice(34).join(' ');
  const hasOverflow = words.length > 34;

  return (
    <div className="text-sm text-neutral-700 whitespace-pre-line">
      {shortText}

      <AnimatePresence>
        {expanded && hasOverflow && (
          <motion.span
            key="extra"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25 }}
          >
            {' ' + extraText}
          </motion.span>
        )}
      </AnimatePresence>

      {hasOverflow && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="ml-2 text-black underline font-medium"
        >
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}
    </div>
  );
};

export default LocationDescription;
