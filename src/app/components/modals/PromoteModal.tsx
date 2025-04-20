'use client';

import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { QRCodeCanvas } from 'qrcode.react';
import Image from 'next/image';
import NextImage from 'next/image';

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
  const [isReady, setIsReady] = useState(false);

  const [copied, setCopied] = useState(false);

  const [showDownloadLayout, setShowDownloadLayout] = useState(false);
  const [mobilePreviewUrl, setMobilePreviewUrl] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (promoteModal.isOpen) {
      const timeout = setTimeout(() => {
        setIsReady(true); // fallback in case onLoad fails
      }, 1000); // fallback duration

      return () => clearTimeout(timeout);
    }
  }, [promoteModal.isOpen]);

  const banner = new window.Image();

  useEffect(() => {
    if (promoteModal.isOpen && currentUser?.referenceId) {
      setReferenceId(currentUser.referenceId);
    }
  }, [promoteModal.isOpen, currentUser]);

  useEffect(() => {
    const preload = (src: string) => {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.src = src;
    };
  
    preload('/images/qrlogo.png');
    preload('/images/promo-banner.png');
  
    if (promoteModal.isOpen && /iPhone|iPad|Android/i.test(navigator.userAgent)) {
      downloadImage();
    }
  }, [promoteModal.isOpen]);  

  const downloadImage = async () => {
    setShowDownloadLayout(true);
  
    await new Promise((r) => setTimeout(r, 500));
    if (!qrDownloadRef.current) return;
  
    const canvas = await html2canvas(qrDownloadRef.current, {
      useCORS: true,
      backgroundColor: null,
      scale: 2,
    });
  
    const dataUrl = canvas.toDataURL('image/png');
    setMobilePreviewUrl(dataUrl);
  };  

  const bodyContent = !isReady ? (
    <div className="flex items-center justify-center h-40">
      <p className="text-sm text-neutral-500">Preparing your passcode...</p>
    </div>
  ) : (
    <div className="flex flex-col items-center gap-4">

      <div 
      ref={scrollRef}
      className="relative w-full max-w-[280px] md:max-w-xs rounded-xl overflow-hidden overflow-y-auto max-h-[400px] md:max-h-none pt-3">
        <Image
          src="/images/promo-banner.png"
          alt="Promo-Banner"
          crossOrigin="anonymous"
          width={869}
          height={600}
          unoptimized
          onLoad={() => {
            const timeout = setTimeout(() => {
              setIsReady(true);
            }, 100); // short delay after load
            return () => clearTimeout(timeout);
          }}
          className="w-full h-auto object-cover rounded-xl scale-[0.85] md:scale-100 -translate-y-4 md:translate-y-0 transition"
        />
        <div className="absolute bottom-12 md:bottom-[18%] left-[40.5%] -translate-x-1/2 bg-white p-2 rounded-xl shadow-lg w-32 h-32 flex items-center justify-center">
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
            {/* <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center pointer-events-none">
              <div className="absolute inset-0 bg-[#3604ff]/80 blur-[6px] rounded-full scale-110 z-10" />
              <img
                src="/images/qrlogo.png"
                alt="QR Logo"
                crossOrigin="anonymous"
                className="w-4/5 h-4/5 object-contain rotate-45 relative z-20"
                style={{
                  pointerEvents: 'none',
                  willChange: 'transform',
                  imageRendering: 'auto',
                  display: 'block'
                }}
              />
            </div> */}
          </div>
        </div>
        <div className="-translate-y-4 md:translate-y-0 flex justify-center items-center">
          {!copied ? (
            <button
              onClick={() => {
                const url = `https://vuoiaggio.netlify.app/reference/${referenceId}`;
                navigator.clipboard.writeText(url);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000); // reset after 2s
              }}
              className="text-sm text-black border-b border-black bg-transparent hover:opacity-70 transition  pt-2"
            >
              Copy Reference Link
            </button>
          ) : (
            <div className="flex items-center gap-2 text-xl text-[#3604ff] px-3 py-1 transition">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="#3604ff"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {/* <span>Copied!</span> */}
            </div>
          )}
        </div>
      </div>

      {showDownloadLayout && (
        <div className="fixed -z-50 opacity-0 pointer-events-none">
          <div
            ref={qrDownloadRef}
            className="relative w-[600px] h-[869px] bg-white rounded-xl overflow-hidden"
          >
            <Image
              src="/images/promo-banner.png"
              alt="Promo-Banner-Download"
              crossOrigin="anonymous"
              width={600}
              height={869}
              unoptimized
              className="w-full h-full object-cover"
              priority
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
                {/* <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center pointer-events-none">
                  <div className="absolute inset-0 bg-[#3604ff]/80 blur-[6px] rounded-full scale-110 z-10" />
                  <img
                    src="/images/qrlogo.png"
                    alt="QR Logo"
                    crossOrigin="anonymous"
                    className="w-4/5 h-4/5 object-contain rotate-45 relative z-20"
                    style={{
                      pointerEvents: 'none',
                      willChange: 'transform',
                      imageRendering: 'auto',
                      display: 'block'
                    }}
                  />
                </div> */}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* {mobilePreviewUrl && (
        <button
          onClick={() => {
            const newWindow = window.open('', '_blank');
            if (newWindow) {
              newWindow.document.write(`
                <html>
                  <head><title>Vuoiaggio Promo</title></head>
                  <body style="margin:0;background:#fff;display:flex;align-items:center;justify-content:center;height:100vh;">
                    <img src="${mobilePreviewUrl}" style="max-width:100%;height:auto;" />
                  </body>
                </html>
              `);
              newWindow.document.close();
              setTimeout(() => {
                setShowDownloadLayout(false);
                promoteModal.onClose();
              }, 1000);
            } else {
              alert('Please enable pop-ups to view and save the image.');
            }
          }}
          className="text-sm mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg shadow"
        >
          Save Promo Image
        </button>
      )} */}

    </div>

  );

  const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);

  if (!isReady) return null;

  return (
    <Modal
      isOpen={promoteModal.isOpen}
      onClose={promoteModal.onClose}
      onSubmit={async () => {
        if (isMobile) {
          promoteModal.onClose();
          return;
        }

        setShowDownloadLayout(true);
        await new Promise((r) => setTimeout(r, 600));

        if (!qrDownloadRef.current) return;
        const canvas = await html2canvas(qrDownloadRef.current, {
          useCORS: true,
          backgroundColor: null,
          scale: 2,
        });

        canvas.toBlob((blob) => {
          if (!blob) return;
          saveAs(blob, `vuoiaggio-promote-${referenceId}.png`);
          setShowDownloadLayout(false);
          promoteModal.onClose();
        });
      }}
      title="Vuoiaggio Passcode"
      actionLabel={isMobile ? "Close" : "Save Passcode"}
      disabled={false}
      body={bodyContent}
      className=""
    />
  );
};

export default PromoteModal;