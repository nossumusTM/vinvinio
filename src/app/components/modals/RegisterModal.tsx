'use client';

import axios from "axios";
import { AiFillGithub } from "react-icons/ai";
import { signIn } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";
import { useCallback, useState } from "react";
import ConfirmPopup from "../ConfirmPopup";
import { toast } from "react-hot-toast";

import {
    FieldValues,
    SubmitHandler,
    useForm
} from "react-hook-form";

import useLoginModal from "@/app/hooks/useLoginModal";
import useRegisterModal from "@/app/hooks/useRegisterModal";

import Modal from "./Modal";
import Input from "../inputs/Input";
import Heading from "../Heading";
import Button from "../Button";

const RegisterModal = () => {
    const registerModal = useRegisterModal();
    const loginModal = useLoginModal();
    const [isLoading, setIsLoading] = useState(false);
    const [role, setRole] = useState<'customer' | 'host' | 'promoter'>('customer');
    const [popupMessage, setPopupMessage] = useState<string | null>(null);

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
                toast.success('Registered', {
                    iconTheme: {
                        primary: '#25F4EE',
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

    const bodyContent = (
        <div className="flex flex-col gap-4">
            {/* <p className="text-lg text-left">Welcome to Vuoiaggio</p> */}
            {/* <Heading title='Welcome to Vuoiaggio' subtitle='' center/> */}

           {/* Role selection */}
            {/* <div className="flex justify-baseline items-center gap-4 flex-wrap">
            <p>I&apos;m a:</p>
            {['customer', 'host', 'promoter'].map((option) => {
                const isSelected = role === option;

                return (
                <button
                    key={option}
                    type="button"
                    onClick={() => setRole(option as any)}
                    className={`
                    px-4 py-2 rounded-full border text-sm font-medium transition
                    border-neutral-300
                    ${isSelected ? 'bg-black text-white' : 'bg-white text-black hover:bg-neutral-100 hover:text-black'}
                    `}
                    disabled={isLoading}
                >
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                </button>
                );
            })}
            </div> */}

            <Input
                id="email"
                label="Email"
                disabled={isLoading}
                register={register}
                errors={errors}
                required
                inputClassName="rounded-xl"
            />
            <Input
                id="name"
                label="Username"
                disabled={isLoading}
                register={register}
                errors={errors}
                required
                inputClassName="rounded-xl"
            />
            <Input
                id="password"
                label="Password"
                type="password"
                disabled={isLoading}
                register={register}
                errors={errors}
                required
                inputClassName="rounded-xl"
            />
            <Input
              id="confirmPassword"
              label="Confirm Password"
              type="password"
              disabled={isLoading}
              register={register}
              errors={errors}
              required
              inputClassName="rounded-xl"
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
        </div>
    );

    const footerContent = (
        <div className="flex flex-col gap-4 mt-3 overflow-y-auto max-h-[40vh] sm:max-h-none">
          <hr />
          <div className="text-neutral-800 text-center font-light">
            <p>
              Already have an account?&nbsp;
              <span
                onClick={onToggle}
                className="text-normal font-normal cursor-pointer underline"
              >
                Log in
              </span>
            </p>
          </div>
          <div className="mb-2">
            <Button
                outline
                label="Continue with Google"
                icon={FcGoogle}
                onClick={() => signIn('google')}
            />
            </div>
        </div>
      );      

    return (
        <Modal
            disabled={isLoading}
            isOpen={registerModal.isOpen}
            title="Welcome to Vuoiaggio"
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
