'use client';

import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { QRCodeCanvas } from 'qrcode.react';
import Image from 'next/image';

import Modal from './Modal';
import usePromoteModal from '@/app/hooks/usePromoteModal';
import { SafeUser } from '@/app/types';

import { useRef } from 'react';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';

interface PromoteModalProps {
  currentUser: SafeUser | null;
}

const PromoteModal: React.FC<PromoteModalProps> = ({ currentUser }) => {
  const promoteModal = usePromoteModal();
  const [referenceId, setReferenceId] = useState('');
  const qrRef = useRef<HTMLDivElement>(null);
  const qrDownloadRef = useRef<HTMLDivElement>(null);

  const [copied, setCopied] = useState(false);

  const [showDownloadLayout, setShowDownloadLayout] = useState(false);

  useEffect(() => {
    if (promoteModal.isOpen && currentUser?.referenceId) {
      setReferenceId(currentUser.referenceId);
    }
  }, [promoteModal.isOpen, currentUser]);

  const bodyContent = (
    <div className="flex flex-col items-center gap-4">

      <div className="relative w-full max-w-xs rounded-xl overflow-hidden">
        <Image
          src="/images/promo-banner.jpg"
          alt="Promo-Banner"
          crossOrigin="anonymous"
          width={869}
          height={600}
          unoptimized
          // className="w-full h-auto object-cover rounded-xl"
          className="w-full h-auto object-cover rounded-xl scale-[0.85] md:scale-100 -translate-y-4 md:translate-y-0 transition"
        />
        <div className="absolute bottom-[20%] left-[40%] -translate-x-1/2 bg-white p-2 rounded-xl shadow-lg w-32 h-32 flex items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center">
            <QRCodeCanvas
              value={`https://vuoiaggio.netlify.app/reference/${referenceId}`}
              size={120}
              bgColor="#ffffff"
              fgColor="#000000"
              level="H"
              className='p-1'
              includeMargin={false}
            />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 shadow-md w-10 h-10 rounded-full overflow-hidden">
            {/* Simulated glass blur background */}
            <div className="absolute inset-0 bg-[#25F4EE]/80 blur-[6px] scale-110" />
            {/* Logo */}
            <div className="relative z-10 w-full h-full flex items-center justify-center">
              <Image
                src="/images/qrlogo.png"
                alt="Logo"
                className="w-4/5 h-4/5 object-contain rotate-45"
                width={32}
                height={32}
              />
            </div>
          </div>
          </div>
        </div>
      </div>
      {/* <p className="text-sm text-neutral-600 break-all text-center">
        {referenceId}
      </p> */}
      <div className="pt-2 -translate-y-4 md:translate-y-0">
        {!copied ? (
          <button
            onClick={() => {
              const url = `https://vuoiaggio.netlify.app/reference/${referenceId}`;
              navigator.clipboard.writeText(url);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000); // reset after 2s
            }}
            className="text-sm text-black border-b border-black bg-transparent hover:opacity-70 transition"
          >
            Copy Reference Link
          </button>
        ) : (
          <div className="flex items-center gap-2 text-xl text-black px-3 py-1 transition">
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="#000"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            {/* <span>Copied!</span> */}
          </div>
        )}
      </div>


      {showDownloadLayout && (
  <div className="fixed -z-50 opacity-0 pointer-events-none">
    <div
      ref={qrDownloadRef}
      className="relative w-[600px] h-[869px] bg-white rounded-xl overflow-hidden"
    >
      <Image
        src="/images/promo-banner.jpg"
        alt="Promo-Banner-Download"
        crossOrigin="anonymous"
        width={600}
        height={869}
        unoptimized
        className="w-full h-full object-cover"
      />

      <div className="absolute bottom-[20%] left-[40%] -translate-x-1/2 bg-white p-3 rounded-xl shadow-lg w-48 h-48 flex items-center justify-center">
        <div className="relative w-full h-full flex items-center justify-center p-3">
          <QRCodeCanvas
            value={`https://vuoiaggio.netlify.app/reference/${referenceId}`}
            size={180}
            bgColor="#ffffff"
            fgColor="#000000"
            level="H"
            includeMargin={false}
            className="bg-white p-1"
          />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 shadow-md w-16 h-16 bg-[#25F4EE]/80 backdrop-blur-md rounded-full flex items-center justify-center">
            <Image
              src="/images/qrlogo.png"
              alt="Logo"
              className="w-4/5 h-4/5 object-contain rotate-45"
              width={48}
              height={48}
              unoptimized
            />
          </div>
        </div>
      </div>
          </div>
        </div>
      )}
    </div>
  );  

  return (
    <Modal
      isOpen={promoteModal.isOpen}
      onClose={promoteModal.onClose}
      onSubmit={async () => {
        setShowDownloadLayout(true);
      
        // Wait for DOM to render & preload image
        await new Promise<void>((resolve) => {
          const preloadImage = new window.Image();
          preloadImage.crossOrigin = 'anonymous';
          preloadImage.src = '/images/promo-banner.jpg';
          preloadImage.onload = () => resolve();
        });
      
        await new Promise((r) => setTimeout(r, 300)); // let DOM paint
      
        if (!qrDownloadRef.current) return;
      
        const canvas = await html2canvas(qrDownloadRef.current, {
          useCORS: true,
          backgroundColor: null,
          scale: 2,
        });
      
        const dataUrl = canvas.toDataURL('image/png');
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      
        if (isIOS) {
          // Open new tab with image instead
          const win = window.open();
          if (win) {
            win.document.write(`<img src="${dataUrl}" style="width:100%;" />`);
          } else {
            alert("Please allow pop-ups to view and save your QR banner.");
          }
        } else {
          // For Android + desktop, download using file-saver
          const link = document.createElement('a');
          link.href = dataUrl;
          link.download = `vuoiaggio-promote-${referenceId}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      
        setShowDownloadLayout(false);
        promoteModal.onClose();
      }}       
      title="Vuoiaggio Passcode"
      actionLabel="Download QR"
      disabled={false}
      body={bodyContent}
      className=""
    />

  );  
};

export default PromoteModal;