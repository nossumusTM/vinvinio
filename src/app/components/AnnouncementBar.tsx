'use client'

import { useEffect, useState } from 'react';
import { IoClose } from 'react-icons/io5';
import { FaCheck } from 'react-icons/fa';

const AnnouncementBar = () => {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText('ESTATERM');
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  };

  useEffect(() => {
    const hasSeen = sessionStorage.getItem('announcementDismissed');
    if (!hasSeen) {
      setVisible(true);

      const timer = setTimeout(() => {
        setVisible(false);
        sessionStorage.setItem('announcementDismissed', 'true');
      }, 10000); // 10 seconds

      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      document.body.classList.add('has-announcement-bar');
    } else {
      document.body.classList.remove('has-announcement-bar');
    }

    return () => {
      document.body.classList.remove('has-announcement-bar');
    };
  }, [visible]);

  const handleClose = () => {
    setVisible(false);
    sessionStorage.setItem('announcementDismissed', 'true');
  };

  if (!visible) return null;

  return (
    <div className="w-full bg-black text-white text-center py-2 px-4 relative">
      <div className="text-sm p-2 font-medium flex flex-col sm:flex-row items-center justify-center gap-2 text-center">
        <span>Get 5% OFF on your first order</span>
        <button
          onClick={handleCopy}
          className="bg-neutral-800 px-3 py-1 rounded-lg text-xs font-semibold hover:bg-neutral-700 transition"
        >
          {copied ? <FaCheck className="inline" /> : 'ESTATERM'}
        </button>
      </div>
      <button
        onClick={handleClose}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:opacity-70"
        aria-label="Close announcement"
      >
        <IoClose size={20} />
      </button>
    </div>
  );
};

export default AnnouncementBar;
