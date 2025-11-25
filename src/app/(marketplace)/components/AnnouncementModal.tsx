'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { IoClose } from 'react-icons/io5';
import { FaCheck } from 'react-icons/fa';
import { FaHeart } from "react-icons/fa6";
import Image from 'next/image';

const AnnouncementModal = () => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const isListingPage = pathname?.startsWith('/listings/') || pathname?.startsWith('/services/');

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
    if (!mounted || !isListingPage) return;
  
    const hasSeen = sessionStorage.getItem('announcementDismissed');
    if (!hasSeen) {
      // Preload the image
      const img = new window.Image();
      img.src = '/images/paperplane.png';
      img.onload = () => {
        setImageLoaded(true);
  
        setTimeout(() => {
          setIsOpen(true);
        }, 10000); // slight delay after image load
      };
    }
  }, [mounted, isListingPage]);

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

if (!imageLoaded) return null;


  return (
    <div className={`fixed inset-0 flex items-center justify-center z-[60] p-6 transition-opacity duration-500 ${isOpen ? 'bg-black bg-opacity-60' : 'bg-opacity-0'}`}>
      <div
        ref={modalRef}
        className={`bg-white rounded-3xl p-8 sm:p-12 max-w-md w-full relative transform transition-all duration-500 ease-out
          ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
        `}
      >

      <div className="p-5 rounded-3xl">
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-black transition"
        >
          <IoClose size={22} />
        </button>

        <div className="flex flex-col items-center justify-center gap-4 text-center">
        <Image
            src="/images/paperplane.png"
            alt="Vuola Promo"
            width={352} // equivalent to w-88 (88 * 4 = 352px)
            height={240} // or set a specific height like 240
            className="h-auto mb-2"
            onLoad={() => setImageLoaded(true)}
            priority
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
              {copied ? 'Copied to Clipboard!' : 'ESTATE25'}
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
