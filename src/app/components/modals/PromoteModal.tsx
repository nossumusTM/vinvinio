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


  useEffect(() => {
    if (promoteModal.isOpen && currentUser?.referenceId) {
      setReferenceId(currentUser.referenceId);
    }
  }, [promoteModal.isOpen, currentUser]);

  // const bodyContent = (
  //   <div className="flex flex-col items-center gap-4">
  //     <p className="text-lg font-semibold text-center">Your Promote Reference</p>
  //     {/* <QRCodeCanvas value={referenceId} size={200} /> */}
  //     <QRCodeCanvas value={`http://localhost:3000/reference/${referenceId}`} size={200} />
  //     <p className="text-sm text-neutral-600 break-all text-center">
  //       {referenceId}
  //     </p>
  //   </div>
  // );

  const bodyContent = (
    <div className="flex flex-col items-center gap-4">
      <p className="text-lg font-semibold text-center">Your Promote Reference</p>
      
      {/* <div className="relative rounded-[10px] overflow-hidden">
        <QRCodeCanvas
          // value={`http://localhost:3000/reference/${referenceId}`}
          value={`https://vuoiaggio.netlify.app/reference/${referenceId}`}
          size={200}
          bgColor="#ffffff"
          fgColor="#000000"
          level="H"
          includeMargin
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none shadow-xl w-12 h-12 bg-[#25F4EE]/50 backdrop-blur-md rounded-xl rotate-45">
          <Image
            src="/images/qrlogo.png"
            alt="Logo"
            className="w-full h-full object-contain p-1"
            width={50}
            height={50}
          />
        </div>
      </div> */}

      <div ref={qrRef} className="relative w-full max-w-xs p-4 bg-white rounded-xl">
        {/* Background sample image */}
        <Image
          src="/images/promo-banner.jpg"
          alt="Promo-Banner"
          width={400}
          height={400}
          className="w-full h-auto rounded-xl object-contain"
        />

        {/* QR code container placed overlapping at the bottom center */}
        <div className="absolute left-1/2 bottom-[-4%] -translate-x-1/2 -translate-y-1/2 bg-white p-2 rounded-xl shadow-lg w-40 h-40 flex items-center justify-center">
          <div ref={qrRef} className="relative w-full h-full flex items-center justify-center p-4">
            <QRCodeCanvas
              value={`https://vuoiaggio.netlify.app/reference/${referenceId}`}
              className='p-4'
              size={160}
              bgColor="#ffffff"
              fgColor="#000000"
              level="H"
              includeMargin={false}
            />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 shadow-md w-14 h-14 bg-[#25F4EE]/90 backdrop-blur-md rounded-full">
              <Image
                src="/images/qrlogo.png"
                alt="Logo"
                unoptimized
                className="w-full h-full object-contain p-1 rotate-45"
                width={50}
                height={50}
              />
            </div>
          </div>
        </div>
      </div>
  
      <p className="text-sm text-neutral-600 break-all text-center">
        {referenceId}
      </p>

      <button
        onClick={async () => {
          if (!qrRef.current) return;
        
          const canvas = await html2canvas(qrRef.current, {
            useCORS: true,
            backgroundColor: null,
            scale: 2
          });
        
          const dataURL = canvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.href = dataURL;
          link.download = `vuoiaggio-promote-${referenceId}.png`;
          link.click();
        }}             
        className="px-4 py-2 bg-[#25F4EE] text-white rounded-xl text-sm hover:opacity-90 transition"
      >
        Download QR
      </button>

    </div>
  );  

  return (
    <Modal
      isOpen={promoteModal.isOpen}
      onClose={promoteModal.onClose}
      onSubmit={promoteModal.onClose} // ✅ Fix here!
      title="Promote Listing"
      actionLabel="Close"
      disabled={false}
      body={bodyContent}
      className=''
    />
  );  
};

export default PromoteModal;