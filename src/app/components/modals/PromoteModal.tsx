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

  const [copied, setCopied] = useState(false);

  const [showDownloadLayout, setShowDownloadLayout] = useState(false);
  const [mobilePreviewUrl, setMobilePreviewUrl] = useState<string | null>(null);

  const banner = new window.Image();

  useEffect(() => {
    if (promoteModal.isOpen && currentUser?.referenceId) {
      setReferenceId(currentUser.referenceId);
    }
  }, [promoteModal.isOpen, currentUser]);

  useEffect(() => {
    if (promoteModal.isOpen && /iPhone|iPad|Android/.test(navigator.userAgent)) {
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
          {/* <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 shadow-md w-10 h-10 rounded-full overflow-hidden"> */}
            {/* Simulated glass blur background */}
            {/* <div className="absolute inset-0 bg-[#25F4EE]/80 blur-[6px] scale-110" /> */}
            {/* Logo */}
            {/* <div className="relative z-10 w-full h-full flex items-center justify-center"> */}
            {/* <Image
              src="/images/qrlogo.png"
              alt="Logo"
              width={32}
              height={32}
              className="w-4/5 h-4/5 object-contain rotate-45"
              style={{ imageRendering: 'auto' }}
            /> */}
            {/* </div> */}
          {/* </div> */}

          <div className="absolute top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center pointer-events-none">
            <div className="absolute inset-0 bg-[#25F4EE]/80 blur-[6px] rounded-full scale-110" />
            <img
              src="/images/qrlogo.png"
              alt="QR Logo"
              className="relative w-4/5 h-4/5 object-contain rotate-45 z-20"
              style={{ pointerEvents: 'none' }}
            />
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
          <div className="flex items-center gap-2 text-xl text-[#25F4EE] px-3 py-1 transition">
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="#25F4EE"
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
              width={32}
              height={32}
              unoptimized
              priority
              crossOrigin="anonymous"
            />
          </div>
        </div>
      </div>
          </div>
        </div>
      )}

      {mobilePreviewUrl && (
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
      )}

    </div>
  );

  return (
    <Modal
      isOpen={promoteModal.isOpen}
      onClose={promoteModal.onClose}
      onSubmit={async () => {
        const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);
      
        if (isMobile) {
          const url = `https://vuoiaggio.netlify.app/reference/${referenceId}`;
          const html = `
            <html>
              <head>
                <title>Vuoiaggio Promo</title>
                <style>
                  body {
                    margin: 0;
                    padding: 0;
                    background: #fff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                  }
                  .container {
                    position: relative;
                    width: 600px;
                    height: 869px;
                  }
                  .container img.bg {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    position: absolute;
                    top: 0;
                    left: 0;
                  }
                  .qr {
                    position: absolute;
                    bottom: 20%;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 180px;
                    height: 180px;
                    background: white;
                    padding: 12px;
                    border-radius: 16px;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.2);
                  }
                  .qr canvas {
                    width: 100% !important;
                    height: 100% !important;
                  }
                  .logo-overlay {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%) rotate(45deg);
                    width: 48px;
                    height: 48px;
                    border-radius: 50%;
                    background: rgba(37, 244, 238, 0.8);
                    backdrop-filter: blur(6px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                  }
                  .logo-overlay img {
                    width: 80%;
                    height: 80%;
                    object-fit: contain;
                  }
                </style>
              </head>
              <body>
                <div class="container">
                  <img class="bg" src="/images/promo-banner.jpg" />
                  <div class="qr">
                    <canvas id="qrCanvas"></canvas>
                    <div class="logo-overlay">
                      <img src="/images/qrlogo.png" />
                    </div>
                  </div>
                </div>
                <script>
                  const canvas = document.getElementById('qrCanvas');
                  const qr = new QRCode(canvas, {
                    text: "${url}",
                    width: 180,
                    height: 180,
                    colorDark : "#000000",
                    colorLight : "#ffffff",
                    correctLevel : QRCode.CorrectLevel.H
                  });
                </script>
                <script src="https://cdn.jsdelivr.net/npm/qrcodejs/qrcode.min.js"></script>
              </body>
            </html>
          `;
      
          const newWindow = window.open();
          if (newWindow) {
            newWindow.document.open();
            newWindow.document.write(html);
            newWindow.document.close();
          } else {
            alert('Please enable pop-ups to view and save the image.');
          }
      
          return;
        }
      
        // DESKTOP BEHAVIOR
        setShowDownloadLayout(true);
        await new Promise((r) => setTimeout(r, 500));
      
        if (!qrDownloadRef.current) return;
      
        const canvas = await html2canvas(qrDownloadRef.current, {
          useCORS: true,
          backgroundColor: null,
          scale: 2,
        });
      
        canvas.toBlob((blob) => {
          if (!blob) return;
          saveAs(blob, `vuoiaggio-promote-${referenceId}.png`);
        });
      
        setShowDownloadLayout(false);
        promoteModal.onClose();
      }}           
      title="Vuoiaggio Passcode"
      actionLabel="Save Passcode"
      disabled={false}
      body={bodyContent}
      className=""
    />

  );  
};

export default PromoteModal;