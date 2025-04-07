'use client';

import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { QRCodeCanvas } from 'qrcode.react';
import Image from 'next/image';

import Modal from './Modal';
import usePromoteModal from '@/app/hooks/usePromoteModal';
import { SafeUser } from '@/app/types';

interface PromoteModalProps {
  currentUser: SafeUser | null;
}

const PromoteModal: React.FC<PromoteModalProps> = ({ currentUser }) => {
  const promoteModal = usePromoteModal();
  const [referenceId, setReferenceId] = useState('');

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
      
      <div className="relative rounded-[10px] overflow-hidden">
        <QRCodeCanvas
          // value={`http://localhost:3000/reference/${referenceId}`}
          value={`https://vuoiaggio.netlify.app/reference/${referenceId}`}
          size={200}
          bgColor="#ffffff"
          fgColor="#000000"
          level="H"
          includeMargin
        />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Image
            src="/images/qrlogo.png"
            alt="Logo"
            className="w-12 h-12 object-contain bg-white p-1 border-radius rotate-45"
            width={50}
            height={50}
          />
        </div>
      </div>
  
      <p className="text-sm text-neutral-600 break-all text-center">
        {referenceId}
      </p>
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
    />
  );  
};

export default PromoteModal;