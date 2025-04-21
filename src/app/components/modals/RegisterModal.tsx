'use client';

import axios from "axios";
import { AiFillGithub } from "react-icons/ai";
import { MdOutlineSwitchAccount } from "react-icons/md";
import { RiShieldUserLine } from "react-icons/ri";
import { MdOutlineModeOfTravel } from "react-icons/md";
import { BiNavigation } from "react-icons/bi";
import { PiBarcode } from "react-icons/pi";
import { signIn } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";
import { useCallback, useState, useEffect } from "react";
import ConfirmPopup from "../ConfirmPopup";
import { toast } from "react-hot-toast";

import {
    FieldValues,
    SubmitHandler,
    useForm
} from "react-hook-form";

import useLoginModal from "@/app/hooks/useLoginModal";
import useRegisterModal from "@/app/hooks/useRegisterModal";
import { motion, AnimatePresence } from 'framer-motion';

import Modal from "./Modal";
import Input from "../inputs/Input";
import Heading from "../Heading";
import Button from "../Button";

const RegisterModal = () => {
    const registerModal = useRegisterModal();
    const loginModal = useLoginModal();
    const [isLoading, setIsLoading] = useState(false);
    const [role, setRole] = useState<'customer' | 'host' | 'promoter' | 'moder'>('customer');
    const [popupMessage, setPopupMessage] = useState<string | null>(null);
    const [step, setStep] = useState(1);

    const {
        register,
        handleSubmit,
        formState: {
            errors,
        },
    } = useForm<FieldValues>({
        defaultValues: {
            name: '',
            email: '',
            password: '',
            confirmPassword: '',
        },
    });

    const onSubmit: SubmitHandler<FieldValues> = (data) => {
      // If still on step 1, go to step 2
      if (step === 1) {
        setStep(2);
        return;
      }

        setIsLoading(true);

        const formData = {
            ...data,
            role // Include selected role
        };

        if (data.password !== data.confirmPassword) {
          toast.error('Passwords do not match');
          setIsLoading(false);
          return;
        }        

        axios.post('/api/register', formData)
            .then(() => {
                toast.success('Welcome to Vuoiaggio! Please sign in to start exploring.', {
                    iconTheme: {
                        primary: 'linear-gradient(135deg, #3d08ff, #04aaff, #3604ff, #0066ff, #3d08ff)',
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
                      setPopupMessage("This email is already registered.");
                    } else if (message === "Name is already taken.") {
                      setPopupMessage("This name is already taken. Please choose another.");
                    } else {
                      setPopupMessage("Something went wrong. Please try again.");
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

    useEffect(() => {
      if (registerModal.isOpen) {
        setStep(1);
      }
    }, [registerModal.isOpen]);    

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
              title={`Continue as a ${role === 'customer' ? 'Traveller' : role === 'host' ? 'Host' : 'Promoter'}`} 
              subtitle="Choose your journey to move forward"
              center 
            />
            <div className="flex justify-center items-center gap-2 flex-wrap pt-6">
              {[
                { key: 'customer', icon: <MdOutlineModeOfTravel size={14} />, label: 'Traveller' },
                { key: 'host', icon: <BiNavigation size={14} />, label: 'Host' },
                { key: 'promoter', icon: <PiBarcode size={14} />, label: 'Promoter' }
              ].map(({ key, icon, label }) => {
                const isSelected = role === key;
    
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setRole(key as any);
                      setStep(2);
                    }}
                    className={`
                      flex items-center gap-2 
                      px-3 py-2 sm:px-6 sm:py-3 
                      rounded-xl 
                      text-[11px] sm:text-base 
                      font-medium 
                      transition 
                      shadow-md hover:shadow-lg
                      ${isSelected ? 'text-white bg-neutral-800' : 'bg-white text-black hover:bg-neutral-100'}
                    `}
                    // style={{
                    //   background: isSelected
                    //     ? 'linear-gradient(45deg, #047dff,rgb(0, 64, 255),rgb(74, 8, 255))'
                    //     : undefined,
                    // }}
                    disabled={isLoading}
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
            {/* <button
                type="button"
                onClick={() => setStep(1)}
                className="text-sm text-neutral-500 hover:text-black self-start"
              >
                ← Back
              </button> */}
            <div className="mb-4">
              <Heading
                title='Your Journey Starts Here'
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
            <Input
              id="name"
              label="Username"
              disabled={isLoading}
              register={register}
              errors={errors}
              required
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

    const footerContent = step === 2 ? (
      <div className="flex flex-col gap-4 mt-3 overflow-y-auto max-h-[40vh] sm:max-h-none">
        <hr />
        <div className="text-neutral-800 text-center font-light">
          <p>
            Already have an account?&nbsp;
            <span
              onClick={onToggle}
              className="text-normal font-normal cursor-pointer underline"
            >
              Sign In
            </span>
          </p>
        </div>
        {/* <div className="mb-2">
          <Button
            outline
            label="Continue with Google"
            icon={FcGoogle}
            onClick={() => signIn('google', { callbackUrl: '/' })}
          />
        </div> */}
      </div>
    ) : undefined;    

    return (
        <Modal
            disabled={isLoading}
            isOpen={registerModal.isOpen}
            title="Sign Up"
            actionLabel="Continue"
            onClose={registerModal.onClose}
            onSubmit={handleSubmit(onSubmit)}
            body={bodyContent}
            footer={footerContent}
            className=""
        />
    );
}

export default RegisterModal;
