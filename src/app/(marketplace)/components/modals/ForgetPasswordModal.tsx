'use client';

import { useForm, FieldValues, SubmitHandler } from "react-hook-form";
import axios from "axios";
import { useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import ResetModal from "./ResetModal";
import Input from "../inputs/Input";
import Heading from "../Heading";
import useForgetPasswordModal from "@/app/(marketplace)/hooks/useForgetPasswordModal";

interface ForgetPasswordModalProps {
    step?: number;
    setStep?: (value: number) => void;
  }

const ForgetPasswordModal: React.FC<ForgetPasswordModalProps> = ({
    step: externalStep,
    setStep: externalSetStep,
  }) => {
  const forgetPasswordModal = useForgetPasswordModal();
  const { isOpen, step, setStep } = forgetPasswordModal;
  const searchParams = useSearchParams();
  const token = searchParams?.get('token');
  const [isLoading, setIsLoading] = useState(false);
  const [internalStep, setInternalStep] = useState(token ? 2 : 1);

  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FieldValues>({
    defaultValues: {
      email: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    if (!forgetPasswordModal.isOpen) {
      setStep(1); // ✅ Reset to step 1 when modal closes
    }
  }, [forgetPasswordModal.isOpen, step, setStep]);

  const onSubmit: SubmitHandler<FieldValues> = async (data) => {
    setIsLoading(true);

    try {
      if (step === 1) {
        const response = await axios.post('/api/email/resetpassword', {
          email: data.email,
        });

        if (response.data.success) {
          toast.success('Reset link sent! Check your email.', {
            iconTheme: {
              primary: '#2200ffff',
              secondary: '#fff',
            },
          });
          forgetPasswordModal.onClose();
        } else {
          toast.error('No account found with this email.');
        }
      }

      if (step === 2) {
        if (!token) {
          toast.error('Reset token missing.');
          return;
        }

        if (data.newPassword !== data.confirmPassword) {
          toast.error('Passwords do not match.');
          return;
        }

        const res = await axios.post('/api/email/setpassword', {
            token,
            newPassword: data.newPassword,
        });          

        if (res.data.success) {
          toast.success('Password updated!', {
            iconTheme: {
              primary: '#2200ffff',
              secondary: '#fff',
            },
          });    
          forgetPasswordModal.onClose();
          router.push('/');
        } else {
          toast.error('Reset link expired or invalid.');
        }
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        toast.error('No account found for this email address..');
      } else {
        toast.error('Something went wrong. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const bodyContent =
    step === 1 ? (
      <div className="flex flex-col gap-4">
        <div className="p-10">
          <Heading
            title="Forgot your password?"
            subtitle="Drop your email to receive a reset link."
          />
        </div>
        <Input
          id="email"
          label="Email"
          disabled={isLoading}
          register={register}
          errors={errors}
          required
          inputClassName="rounded-xl"
        />
      </div>
    ) : (
      <div className="flex flex-col gap-4">
        <Heading
          title="Set a new password"
          subtitle="Enter and confirm your new password."
        />
        <Input
          id="newPassword"
          label="New Password"
          type="password"
          disabled={isLoading}
          register={register}
          errors={errors}
          required
        />
        <Input
          id="confirmPassword"
          label="Confirm Password"
          type="password"
          disabled={isLoading}
          register={register}
          errors={errors}
          required
        />
      </div>
    );

  return (
    <ResetModal
      disabled={isLoading}
      isOpen={forgetPasswordModal.isOpen}
      title="Restore Account"
      actionLabel={step === 1 ? "Send reset link" : "Update Password"}
      onClose={forgetPasswordModal.onClose}
      onSubmit={handleSubmit(onSubmit)}
      body={bodyContent}
      className=""
    />
  );
};

export default ForgetPasswordModal;
