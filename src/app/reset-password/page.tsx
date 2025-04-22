'use client';

import { useEffect, useState, useRef } from 'react';
import ForgetPasswordModal from '@/app/components/modals/ForgetPasswordModal';
import useForgetPasswordModal from '@/app/hooks/useForgetPasswordModal';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'react-hot-toast';

let hasValidated = false;

const ResetPasswordPage = () => {
  const forgetPasswordModal = useForgetPasswordModal();
  const searchParams = useSearchParams();
  const token = searchParams?.get('token');
  const [validated, setValidated] = useState(false);
  const hasValidatedRef = useRef(false);
  const [step, setStep] = useState(1);
  const router = useRouter();
  
  useEffect(() => {
    if (!token || hasValidated) return;

    hasValidated = true; // 🚧 prevent any further calls after first

    const validateToken = async () => {
      try {
        const res = await axios.post('/api/email/resetpassword/validate', { token });

        if (res.data.valid) {
          forgetPasswordModal.setStep(2);
          forgetPasswordModal.onOpen();
          setValidated(true);
        } else {
          forgetPasswordModal.onClose();
          toast.error('Reset link is invalid or expired.');
          setTimeout(() => router.push('/'), 2500);
        }
      } catch (err) {
        forgetPasswordModal.onClose();
        toast.error('Failed to validate reset token.');
        setTimeout(() => router.push('/'), 2500);
      }
    };

    validateToken();
  }, [token, forgetPasswordModal, router]);

  return (
    <div>
      {validated && <ForgetPasswordModal step={step} setStep={setStep} />}
    </div>
  );
};

export default ResetPasswordPage;
