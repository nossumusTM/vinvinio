 'use client';
 
import axios from "axios";
import { MdOutlineModeOfTravel } from "react-icons/md";
import { GiWingfoot } from "react-icons/gi";
import { MdNaturePeople } from "react-icons/md";
import { BiNavigation } from "react-icons/bi";
import { BsPlugin } from "react-icons/bs";
import { MdUsb } from "react-icons/md";
import { PiBarcode } from "react-icons/pi";
import { useCallback, useState, useEffect, useMemo } from "react";
import ConfirmPopup from "../ConfirmPopup";
import { toast } from "react-hot-toast";
 
 import {
     FieldValues,
     SubmitHandler,
     useForm
 } from "react-hook-form";
 
import useLoginModal from "@/app/(marketplace)/hooks/useLoginModal";
import useRegisterModal from "@/app/(marketplace)/hooks/useRegisterModal";
import useCountries from "@/app/(marketplace)/hooks/useCountries";
import { motion, AnimatePresence } from 'framer-motion';

import Modal from "./Modal";
import Input from "../inputs/Input";
import Heading from "../Heading";
import PhoneNumberInput from "../inputs/PhoneNumberInput";
import { formatPhoneNumberToE164 } from "@/app/(marketplace)/utils/phone";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
 
 const RegisterModal = () => {
    const registerModal = useRegisterModal();
    const loginModal = useLoginModal();
    const { getAll } = useCountries();
    const [isLoading, setIsLoading] = useState(false);
    const [role, setRole] = useState<'customer' | 'host' | 'promoter' | 'moder'>('customer');
    const [popupMessage, setPopupMessage] = useState<string | null>(null);
    const [step, setStep] = useState(1);
    const [phoneCountry, setPhoneCountry] = useState('IT');
    const [phoneInput, setPhoneInput] = useState('');
    const [phoneError, setPhoneError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        setValue,
        formState: {
            errors,
        },
    } = useForm<FieldValues>({
        defaultValues: {
            name: '',
            email: '',
            password: '',
            confirmPassword: '',
            phone: '',
        },
    });

    const countries = useMemo(() => getAll(), [getAll]);
    const phoneDialCode = useMemo(() => {
      const country = countries.find((entry) => entry.value === phoneCountry);
      return country?.dialCode ?? null;
    }, [countries, phoneCountry]);
 

    const onSubmit: SubmitHandler<FieldValues> = (data) => {
      // If still on step 1, go to step 2
      if (step === 1) {
        setStep(2);
        return;
      }

        const formattedPhone = formatPhoneNumberToE164(
          phoneInput,
         phoneDialCode ?? undefined,
       );
       if (!formattedPhone) {
          setPhoneError('Enter a valid phone number.');
          return;
        }

        if (data.password !== data.confirmPassword) {
          toast.error('Passwords do not match');
          return;
        }

        setIsLoading(true);

        setPhoneError(null);

        const formData = {
            ...data,
            role, // Include selected role
            phone: formattedPhone,
        };

        axios.post('/api/register', formData)
            .then(() => {
                toast.success('Welcome to Vinvin! Please sign in to start exploring.', {
                     iconTheme: {
                         primary: '#2200ffff',
                         secondary: '#fff',
                     },
                   });
                 registerModal.onClose();
                 loginModal.onOpen();
             })

            .catch((error) => {
                if (axios.isAxiosError(error)) {
                  if (error.response?.status === 409) {
                    const message = error.response.data;

                    if (message === "Email already in use" || message === "Email is already registered.") {
                      // setPopupMessage("This email is already registered.");
                     toast.error('This email is already registered.');
                   } else if (message === "Name is already taken.") {
                     // setPopupMessage("This name is already taken. Please choose another.");
                      toast.error('This name is already taken. Please choose another.');
                    } else if (message === "Phone number already in use") {
                      toast.error('This phone number is already registered.');
                    } else {
                      // setPopupMessage("Something went wrong. Please try again.");
                      toast.error('Something went wrong. Please try again.');
                    }
               
                   } else if (error.response?.data) {
                     setPopupMessage(error.response.data);
                   } else {
                     setPopupMessage("Something went wrong.");
                   }
                 } else if (error.response?.status === 403) {
                   setPopupMessage("Only administrators can register as a moderator.");
                 } else {
                   setPopupMessage("Unexpected error occurred.");
                 }
               })            
             .finally(() => {
                 setIsLoading(false);
             });
    };

    const onToggle = useCallback(() => {
        registerModal.onClose();
        loginModal.onOpen();
    }, [registerModal, loginModal]);

    const goBackToRoleSelect = useCallback(() => {
      setStep(1);
      setPhoneError(null);
    }, []);
   
    useEffect(() => {
      if (registerModal.isOpen) {
        setStep(1);
        setPhoneCountry('IT');
        setPhoneInput('');
        setPhoneError(null);
        setValue('phone', '');
      }
   }, [registerModal.isOpen, setValue]);

    useEffect(() => {
      if (step !== 2) {
        return;
      }

      const formatted = formatPhoneNumberToE164(phoneInput, phoneDialCode ?? undefined) ?? '';
      setValue('phone', formatted);

    }, [phoneInput, phoneDialCode, setValue, step]);
 
     const bodyContent = (
       <AnimatePresence mode="wait">
         <motion.div
           key={`step-${step}`}
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           exit={{ opacity: 0, y: -10 }}
           transition={{ duration: 0.25 }}
           className="flex flex-col gap-2"
         >
 
         {step === 1 ? (
          <>
            <Heading
              title={`Continue as a ${
                role === 'customer' ? 'Customer' : role === 'host' ? 'Provider' : 'Promoter'
              }`}
              subtitle="Choose your journey to move forward"
              center
            />

            <div className="flex justify-center items-center gap-2 flex-wrap pt-6">
              {([
                { key: 'customer' as const, icon: <MdNaturePeople size={24} />, label: 'Customer' },
                { key: 'host' as const, icon: <MdUsb size={24} />, label: 'Provider' },
                { key: 'promoter' as const, icon: <PiBarcode size={24} />, label: 'Promoter' },
              ]).map(({ key, icon, label }) => {
                const isActive = role === key;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setRole(key);
                      setStep(2);          // 👈 jump straight to form step
                      setPhoneError(null); // optional: clear phone errors when switching
                    }}
                    disabled={isLoading}
                    className={`
                      inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium
                      shadow-md transition
                      ${isActive
                        ? 'bg-neutral-50/60 text-neutral-900'
                        : 'bg-white text-neutral-800 hover:shadow-lg'}
                    `}
                  >
                    <span className="text-xl">{icon}</span>
                    {label}
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <>
            {/* rest of step 2 stays as you have it */}

             {/* <button
                 type="button"
                 onClick={() => setStep(1)}
                 className="text-sm text-neutral-500 hover:text-black self-start"
               >
                 ← Back
               </button> */}
             <div className="mb-4">
               <Heading
                 title=''
                 subtitle='Lights, camera… just need your info to run the show.'
               />
             </div>

            <Input
              id="email"
              label="Email"
              disabled={isLoading}
              register={register}
              errors={errors}
              required
              inputClassName="h-14 lg:h-[46px] text-base rounded-xl"
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
              hint="We'll verify this number with a quick SMS after you sign up."
              inputId="register-phone"
            />
            <Input
              id="name"
              label="Username"
              disabled={isLoading}
              register={register}
              errors={errors}
              required
              validationOptions={{
                pattern: {
                  value: /^[A-Za-z0-9]+$/,
                  message: 'Use only letters and numbers (no spaces or symbols).',
                },
                setValueAs: (value: string) => value?.trim() ?? '',
              }}
              inputClassName="h-14 lg:h-[46px] text-base rounded-xl"
            />
             <Input
              id="password"
              label="Password"
              type="password"
              disabled={isLoading}
              register={register}
              errors={errors}
              required
              withVisibilityToggle
              inputClassName="h-14 lg:h-[46px] text-base rounded-xl"
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
              inputClassName="h-14 lg:h-[46px] text-base rounded-xl"
            />
             {popupMessage && (
               <ConfirmPopup
                 title="Notice"
                 message={popupMessage}
                 hideCancel
                 confirmLabel="OK"
                 onConfirm={() => setPopupMessage(null)}
               />
             )}
           </>
         )}
         </motion.div>
       </ AnimatePresence>
     );    
        
    const footerContent = (
      <div className="mt-4 flex flex-col gap-4">
        <div className="flex items-center justify-center gap-2 text-xs text-neutral-500">
          <span>Already have an account?</span>
          <button
            type="button"
            onClick={onToggle}
            className="font-semibold text-neutral-800 underline-offset-4 transition hover:underline"
          >
            Login
          </button>
        </div>
      </div>
    );
 
    return (
        <Modal
            disabled={isLoading}
            isOpen={registerModal.isOpen}
            title="Sign Up"
            actionLabel={step === 2 ? 'Register' : 'Continue'}
            onClose={registerModal.onClose}
            onSubmit={handleSubmit(onSubmit)}
            body={bodyContent}
            footer={footerContent}
            className=""
            closeOnSubmit={false}
            secondaryAction={step === 2 ? goBackToRoleSelect : undefined}
            secondaryActionLabel={step === 2 ? 'Back' : undefined}
            preventOutsideClose
        />
    );
}
 
 export default RegisterModal;
