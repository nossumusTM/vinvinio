'use client';

import { useEffect, useState, useRef } from 'react';
import { IoClose } from 'react-icons/io5';
import { FaCheck } from 'react-icons/fa';
import { FaHeart } from "react-icons/fa6";

const AnnouncementModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

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

    const timer = setTimeout(() => {
      setImageLoaded(true);
    }, 1500); // fallback in case onLoad doesn't fire

    const hasSeen = sessionStorage.getItem('announcementDismissed');
    if (!hasSeen) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 5000); // 20 seconds

      return () => clearTimeout(timer);
    }
  }, [mounted]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        handleClose();
      }
    };
  
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
  
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);  

  if (!isOpen || !imageLoaded) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-8">
      <div
        ref={modalRef}
        className="bg-white rounded-2xl p-8 sm:p-12 max-w-md w-full relative"
      >

      <div className="p-10 rounded-2xl  shadow-xl">
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-black transition"
        >
          <IoClose size={22} />
        </button>

        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <img
            src="/images/paperplane.png"
            alt="Vuoiaggio Promo"
            className="w-88 h-auto mb-2"
            onLoad={() => setImageLoaded(true)}
          />
          <h2 className="text-2xl text-left font-semibold text-gray-900">
            GET 5% OFF ON YOUR FIRST BOOKING ᥫ᭡
          </h2>
          <p className="text-sm  text-left text-gray-700">
            Use the promocode below at checkout:
          </p>

          <div className="flex flex-col items-center gap-1">
          <button
              onClick={handleCopy}
              className="bg-transparent border border-black border-dashed px-4 py-2 rounded-xl text-sm font-semibold text-black transition mb-2"
            >
              {copied ? 'Copied to Clipboard!' : 'ESTATERM25'}
            </button>

            {/* {copied && (
              <span className="text-xs text-black border-b border-black mt-1">
                Copied to Clipboard!
              </span>
            )} */}
          </div>

        </div>
      </div>
      </div>
    </div>
  );
};

export default AnnouncementModal;
