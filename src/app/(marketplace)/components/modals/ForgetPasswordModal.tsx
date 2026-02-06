 'use client';
 
 import { useForm, FieldValues, SubmitHandler } from "react-hook-form";
 import axios from "axios";
 import { useSearchParams, useRouter } from "next/navigation";
 import { toast } from "react-hot-toast";
 import { useEffect, useMemo, useState, useCallback, type ReactNode } from "react";
 import { FiMail, FiPhone } from "react-icons/fi";
 import { HiMiniArrowLeft } from "react-icons/hi2";

 import { motion, AnimatePresence, Variants } from 'framer-motion';
 
 import ResetModal from "./ResetModal";
 import Input from "../inputs/Input";
 import Heading from "../Heading";
 import PhoneNumberInput from "../inputs/PhoneNumberInput";
 import useForgetPasswordModal from "@/app/(marketplace)/hooks/useForgetPasswordModal";
 import useLoginModal from "@/app/(marketplace)/hooks/useLoginModal";
 import useCountries from "@/app/(marketplace)/hooks/useCountries";
 import { formatPhoneNumberToE164 } from "@/app/(marketplace)/utils/phone";

type RecoveryMethod = 'email' | 'phone';
type FlowState = 'method' | 'email-request' | 'email-token' | 'phone-request' | 'phone-verify';

const methodOptions: Array<{ key: RecoveryMethod; title: string; description: string; icon: ReactNode; }> = [
  {
    key: 'email',
    title: 'Email link',
    description: 'Receive a secure reset link at your inbox.',
    icon: <FiMail className="text-lg" />,
  },
  {
    key: 'phone',
    title: 'Phone number',
    description: 'Reset your password with an SMS code.',
    icon: <FiPhone className="text-lg" />,
  },
];

const flowActionLabels: Record<FlowState, string> = {
  method: 'Continue',
  'email-request': 'Send',
  'email-token': 'Update',
  'phone-request': 'Send',
  'phone-verify': 'Update',
};
 
 interface ForgetPasswordModalProps {
     step?: number;
     setStep?: (value: number) => void;
   }
 
const ForgetPasswordModal: React.FC<ForgetPasswordModalProps> = () => {
   const forgetPasswordModal = useForgetPasswordModal();
  const loginModal = useLoginModal();
  const { isOpen, step } = forgetPasswordModal;
   const searchParams = useSearchParams();
   const token = searchParams?.get('token');
  const router = useRouter();
  const { getAll } = useCountries();

  const [isLoading, setIsLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<RecoveryMethod>('email');
  const [flow, setFlow] = useState<FlowState>('method');
  const [phoneCountry, setPhoneCountry] = useState('IT');
  const [phoneInput, setPhoneInput] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [phoneResetTarget, setPhoneResetTarget] = useState<string | null>(null);
 
  const countries = useMemo(() => getAll(), [getAll]);
  const phoneDialCode = useMemo(() => {
    const country = countries.find((entry) => entry.value === phoneCountry);
    return country?.dialCode ?? null;
  }, [countries, phoneCountry]);
 
   const {
     register,
     handleSubmit,
     reset,
     formState: { errors },
   } = useForm<FieldValues>({
     defaultValues: {
       email: '',
       newPassword: '',
       confirmPassword: '',
       code: '',
     },
   });
   
   const stepVariants: Variants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };
 
   useEffect(() => {
    if (!isOpen) {
      reset({ email: '', newPassword: '', confirmPassword: '', code: '' });
      setSelectedMethod('email');
      setPhoneCountry('IT');
      setPhoneInput('');
      setPhoneError(null);
      setPhoneResetTarget(null);
      setFlow('method');
      return;
    }

    if (step === 2) {
      setFlow('email-token');
    } else {
      setFlow('method');
     }
  }, [isOpen, step, reset]);

  const handleBackToLogin = useCallback(() => {
    forgetPasswordModal.onClose();
    loginModal.onOpen();
  }, [forgetPasswordModal, loginModal]);

  const handleFlowBack = useCallback(() => {
    if (flow === 'phone-verify') {
      setFlow('phone-request');
      return;
    }

    setPhoneResetTarget(null);
    setPhoneInput('');
    setPhoneError(null);
    setFlow('method');
  }, [flow]);

   const onSubmit: SubmitHandler<FieldValues> = async (data) => {
    if (flow === 'method') {
      toast.error('Choose email or phone to continue.');
      return;
    }

    if (flow === 'email-request') {
      setIsLoading(true);
      try {
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
          loginModal.onOpen();
         } else {
           toast.error('No account found with this email.');
         }
      } catch (error: any) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          toast.error('No account found for this email address.');
        } else {
          toast.error('Something went wrong. Please try again.');
        }
      } finally {
        setIsLoading(false);
       }
      return;
    }
 
    if (flow === 'email-token') {
      if (!token) {
        toast.error('Reset token missing.');
        return;
      }
 
      if (data.newPassword !== data.confirmPassword) {
        toast.error('Passwords do not match.');
        return;
      }
 
      setIsLoading(true);
      try {
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
          loginModal.onOpen();
           router.push('/');
         } else {
           toast.error('Reset link expired or invalid.');
         }
      } catch (error) {
         toast.error('Something went wrong. Please try again.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (flow === 'phone-request') {
      const formattedPhone = formatPhoneNumberToE164(
        phoneInput,
        phoneDialCode ?? undefined,
      );

      if (!formattedPhone) {
        setPhoneError('Enter a valid phone number.');
        return;
      }

      setIsLoading(true);
      try {
        await axios.post('/api/password-reset/phone/request', { phone: formattedPhone });
        toast.success('Verification code sent via SMS.');
        setPhoneResetTarget(formattedPhone);
        setPhoneError(null);
        setFlow('phone-verify');
      } catch (error: any) {
        if (axios.isAxiosError(error) && error.response?.data?.error) {
          toast.error(error.response.data.error);
        } else {
          toast.error('Unable to send verification code.');
        }
      } finally {
        setIsLoading(false);
       }
      return;
    }

    if (flow === 'phone-verify') {
      if (!phoneResetTarget) {
        toast.error('Enter your phone number to request a code.');
        setFlow('phone-request');
        return;
      }

      if (!data.code) {
        toast.error('Verification code is required.');
        return;
      }

      if (data.newPassword !== data.confirmPassword) {
        toast.error('Passwords do not match.');
        return;
      }

      setIsLoading(true);
      try {
        await axios.post('/api/password-reset/phone/confirm', {
          phone: phoneResetTarget,
          code: data.code,
          newPassword: data.newPassword,
        });

        toast.success('Password updated! Sign in with your new credentials.');
        forgetPasswordModal.onClose();
        loginModal.onOpen();
      } catch (error: any) {
        if (axios.isAxiosError(error) && error.response?.data?.error) {
          toast.error(error.response.data.error);
        } else {
          toast.error('Unable to update password with the provided code.');
        }
      } finally {
        setIsLoading(false);
      }
      return;
     }
   };
 
  const bodyContent = (
    <div className="flex flex-col gap-5">
      <button
        type="button"
        onClick={handleBackToLogin}
        className="inline-flex items-center gap-2 self-start rounded-full px-4 py-2 text-sm font-medium text-neutral-700 border-b border-neutral-50 transition hover:border-neutral-100"
      >
        <HiMiniArrowLeft />
        BACK TO SIGN IN
      </button>

      <AnimatePresence mode="wait">
        {flow === 'method' && (
          <motion.div
            key="method"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="flex flex-col gap-5"
          >
            <div className="flex flex-col gap-5">
              <Heading
                title="Forgot your password?"
                subtitle="Choose how you'd like to recover your account."
              />
              <div className="grid gap-3 sm:grid-cols-2">
                {methodOptions.map((option) => {
                  const active = selectedMethod === option.key;
                  return (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => {
                        const key = option.key as RecoveryMethod;
                        setSelectedMethod(key);
                        setFlow(key === 'email' ? 'email-request' : 'phone-request');
                      }}
                      className={`flex h-full flex-col gap-2 rounded-2xl p-4 text-left transition ${
                        active
                          ? 'bg-neutral-50/60 text-neutral-900 shadow-md shadow-neutral-900/20'
                          : 'bg-white text-neutral-800 shadow-md hover:border-neutral-400 hover:shadow-lg'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`aspect-square flex h-10 w-10 items-center justify-center rounded-xl text-base font-medium ${
                            active ? 'bg-white text-neutral-800' : 'bg-neutral-50/60 text-neutral-800'
                          }`}
                        >
                          {option.icon}
                        </span>
                        <div>
                          <p className="text-sm font-semibold uppercase tracking-wide">
                            {option.title}
                          </p>
                          <p className="text-xs text-neutral-500">
                            {option.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {flow === 'email-request' && (
          <motion.div
            key="email-request"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="flex flex-col gap-4"
          >
          <Heading
            title="We'll send you a link"
            subtitle="Enter the email associated with your account."
          />
          <Input
            id="email"
            label="Email"
            disabled={isLoading}
            register={register}
            errors={errors}
            required
            inputClassName="rounded-xl"
          />
        </motion.div>
      )}

      {flow === 'email-token' && (
         <motion.div
            key="email-token"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="flex flex-col gap-4"
          >
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
            withVisibilityToggle
          />
          <Input
            id="confirmPassword"
            label="Confirm Password"
            type="password"
            disabled={isLoading}
            register={register}
            errors={errors}
            required
            withVisibilityToggle
          />
        </motion.div>
      )}

      {flow === 'phone-request' && (
        <motion.div
            key="phone-request"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="flex flex-col gap-4"
          >
          <Heading
            title="Recover via SMS"
            subtitle="Enter your phone number to receive a verification code."
          />
          <PhoneNumberInput
            countryCode={phoneCountry}
            onCountryChange={(value) => {
              setPhoneCountry(value);
              setPhoneError(null);
            }}
            value={phoneInput}
            onValueChange={(value) => {
              setPhoneInput(value);
              setPhoneError(null);
            }}
            disabled={isLoading}
            error={phoneError}
            label="Phone number"
            hint={phoneDialCode ? `Include only the local part. We'll prepend ${phoneDialCode}.` : undefined}
            inputId="reset-phone"
          />
        </motion.div>
      )}

      {flow === 'phone-verify' && (
        <motion.div
            key="phone-verify"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="flex flex-col gap-4"
          >
          <Heading
            title="Enter the verification code"
            subtitle="Use the code we sent via SMS, then choose a new password."
          />
          <Input
            id="code"
            label="Verification code"
            disabled={isLoading}
            register={register}
            errors={errors}
            required
            inputClassName="rounded-xl"
          />
          <Input
            id="newPassword"
            label="New Password"
            type="password"
            disabled={isLoading}
            register={register}
            errors={errors}
            required
            withVisibilityToggle
          />
          <Input
            id="confirmPassword"
            label="Confirm Password"
            type="password"
            disabled={isLoading}
            register={register}
            errors={errors}
            required
            withVisibilityToggle
          />
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );

  const canGoBack = flow === 'email-request' || flow === 'phone-request' || flow === 'phone-verify';
 
   return (
     <ResetModal
       disabled={isLoading}
       isOpen={forgetPasswordModal.isOpen}
       title="Restore Account"
       actionLabel={flowActionLabels[flow]}
       onClose={forgetPasswordModal.onClose}
       onSubmit={handleSubmit(onSubmit)}
       body={bodyContent}
       className=""
       secondaryAction={canGoBack ? handleFlowBack : undefined}
       secondaryActionLabel={canGoBack ? 'Back' : undefined}
     />
   );
 };
 
 export default ForgetPasswordModal;