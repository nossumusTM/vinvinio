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

interface PromoteModalProps {
  currentUser: SafeUser | null;
}

const PromoteModal: React.FC<PromoteModalProps> = ({ currentUser }) => {
  const promoteModal = usePromoteModal();
  const [referenceId, setReferenceId] = useState('');
  const qrRef = useRef<HTMLDivElement>(null);
  const qrDownloadRef = useRef<HTMLDivElement>(null);

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
          width={869}
          height={600}
          unoptimized
          className="w-full h-auto object-cover rounded-xl"
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
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 shadow-md w-10 h-10 bg-[#25F4EE]/90 backdrop-blur-md rounded-full flex items-center justify-center">
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
      <p className="text-sm text-neutral-600 break-all text-center">
        {referenceId}
      </p>

      {showDownloadLayout && (
  <div className="fixed -z-50 opacity-0 pointer-events-none">
    <div
      ref={qrDownloadRef}
      className="relative w-[600px] h-[869px] bg-white rounded-xl overflow-hidden"
    >
      <Image
        src="/images/promo-banner.jpg"
        alt="Promo-Banner-Download"
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
      className="bg-white"
    />
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 shadow-md w-16 h-16 bg-[#25F4EE]/90 backdrop-blur-md rounded-full flex items-center justify-center">
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
        setShowDownloadLayout(true); // show hidden div first
        await new Promise((resolve) => setTimeout(resolve, 100)); // wait for DOM to render
      
        if (!qrDownloadRef.current) return;
      
        const canvas = await html2canvas(qrDownloadRef.current);
        const dataURL = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = dataURL;
        link.download = `vuoiaggio-promote-${referenceId}.png`;
        link.click();
      
        setShowDownloadLayout(false); // clean up hidden div
        promoteModal.onClose();
      }}
      title="Promote Listing"
      actionLabel="Download QR"
      disabled={false}
      body={bodyContent}
      className=""
    />
  );  
};

export default PromoteModal;