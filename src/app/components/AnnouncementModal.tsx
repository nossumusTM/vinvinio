'use client';

import { useEffect, useState } from 'react';
import { IoClose } from 'react-icons/io5';
import { FaCheck } from 'react-icons/fa';

const AnnouncementModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText('ESTATERM');
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  };

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem('announcementDismissed', 'true');
  };

  useEffect(() => {
    setMounted(true); // now it's mounted on client
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const hasSeen = sessionStorage.getItem('announcementDismissed');
    if (!hasSeen) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 10000); // 20 seconds

      return () => clearTimeout(timer);
    }
  }, [mounted]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-xl p-4 sm:p-6 max-w-md w-full relative">
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-black transition"
        >
          <IoClose size={22} />
        </button>

        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <img
            src="/images/vuoiaggiologo.png"
            alt="Vuoiaggio Logo"
            className="w-48 h-auto mb-2"
          />
          <h2 className="text-lg font-semibold text-gray-900">
            Get 5% OFF on your first order!
          </h2>
          <p className="text-sm text-gray-700">
            Use the promocode below at checkout:
          </p>

          <div className="flex flex-col items-center gap-1">
          <button
              onClick={handleCopy}
              className="bg-transparent border border-black border-dashed px-4 py-2 rounded-xl text-sm font-semibold text-black transition"
            >
              ESTATERM25
            </button>
            {copied && (
              <span className="text-xs text-black border-b border-black mt-1">
                Copied to Clipboard!
              </span>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default AnnouncementModal;
