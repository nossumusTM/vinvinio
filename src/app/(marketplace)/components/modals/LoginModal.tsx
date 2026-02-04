'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  FieldValues,
  SubmitHandler,
  useForm,
} from 'react-hook-form';
import { FcGoogle } from 'react-icons/fc';
import { FiMail, FiPhone } from 'react-icons/fi';

import useRegisterModal from '@/app/(marketplace)/hooks/useRegisterModal';
import useLoginModal from '@/app/(marketplace)/hooks/useLoginModal';
import useForgetPasswordModal from '@/app/(marketplace)/hooks/useForgetPasswordModal';
import useCountries from '@/app/(marketplace)/hooks/useCountries';

import ForgetPasswordModal from './ForgetPasswordModal';
import Modal from './Modal';
import Input from '../inputs/Input';
import Heading from '../Heading';
import Button from '../Button';
import PhoneNumberInput from '../inputs/PhoneNumberInput';
import { formatPhoneNumberToE164 } from '@/app/(marketplace)/utils/phone';
import { HiMiniArrowLeft } from "react-icons/hi2";

type AuthMethod = 'email' | 'phone';

const methodOptions: Array<{
  key: AuthMethod;
  title: string;
  description: string;
  icon: ReactNode;
}> = [
  {
    key: 'email',
    title: 'Email address',
    description: 'Use your email and password to sign in.',
    icon: <FiMail className="text-lg" />,
  },
  {
    key: 'phone',
    title: 'Phone number',
    description: 'Authenticate with the phone number on your account.',
    icon: <FiPhone className="text-lg" />,
  },
];

const stepVariants = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

const LoginModal = () => {
  const router = useRouter();
  const loginModal = useLoginModal();
  const registerModal = useRegisterModal();
  const forgetPasswordModal = useForgetPasswordModal();
  const { getAll } = useCountries();

  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'method' | 'form' | 'twoFactor' | 'altOptions'>('method');
  const [selectedMethod, setSelectedMethod] = useState<AuthMethod>('email');
  const [phoneCountry, setPhoneCountry] = useState('IT');
  const [phoneInput, setPhoneInput] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [identifierError, setIdentifierError] = useState<string | null>(null);
  // const [emailValue, setEmailValue] = useState('');

  const [needsTwoFactor, setNeedsTwoFactor] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorError, setTwoFactorError] = useState<string | null>(null);

  const countries = useMemo(() => getAll(), [getAll]);
  const phoneDialCode = useMemo(() => {
    const country = countries.find((entry) => entry.value === phoneCountry);
    return country?.dialCode ?? null;
  }, [countries, phoneCountry]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FieldValues>({
    defaultValues: {
      identifier: '',
      password: '',
      method: 'email',
      totpCode: '',
    },
  });

  const identifierValue = watch('identifier');
  const passwordValue = watch('password');

  const [showAltOptions, setShowAltOptions] = useState(false);

  // useEffect(() => {
  //   if (!loginModal.isOpen) {
  //       return;
  //   }

  //   setStep('method');          // 👈 ensure we always start here
  //   setSelectedMethod('email');
  //   setPhoneCountry('IT');
  //   setPhoneInput('');
  //   setPhoneError(null);
  //   setIdentifierError(null);
  //   setEmailValue('');
  //   reset({ identifier: '', password: '', method: 'email' });
  // }, [loginModal.isOpen, reset]);

  // useEffect(() => {
  //   if (selectedMethod === 'email') {
  //     setEmailValue(identifierValue ?? '');
  //   }
  // }, [identifierValue, selectedMethod]);

  // useEffect(() => {
  //   if (selectedMethod === 'email') {
  //     setEmailValue(identifierValue ?? '');
  //   }
  // }, [identifierValue, selectedMethod]);

  useEffect(() => {
    if (!loginModal.isOpen) {
      return;
    }

    setStep('method');
    setSelectedMethod('email');
    setPhoneCountry('IT');
    setPhoneInput('');
    setPhoneError(null);
    setIdentifierError(null);
    // setEmailValue('');
    setNeedsTwoFactor(false);
    setTwoFactorCode('');
    setTwoFactorError(null);
    reset({ identifier: '', password: '', method: 'email' });
  }, [loginModal.isOpen, reset]);

  useEffect(() => {
    setValue('method', selectedMethod);

    // Solo per phone forziamo identifier, l'email la lascia gestire a RHF
    if (selectedMethod === 'phone') {
      const formatted =
        formatPhoneNumberToE164(phoneInput, phoneDialCode ?? undefined) ?? '';
      setValue('identifier', formatted);
    }
  }, [selectedMethod, setValue, phoneInput, phoneDialCode]);

  useEffect(() => {
    if (selectedMethod !== 'phone') {
      return;
    }

    const formatted = formatPhoneNumberToE164(phoneInput, phoneDialCode ?? undefined) ?? '';
    setValue('identifier', formatted);
  }, [selectedMethod, phoneInput, phoneDialCode, setValue]);

  const onToggleRegister = useCallback(() => {
    loginModal.onClose();
    registerModal.onOpen();
  }, [loginModal, registerModal]);

  const goBackToMethod = useCallback(() => {
    setStep('method');
    setIdentifierError(null);
    setPhoneError(null);
  }, []);

  // const onSubmit: SubmitHandler<FieldValues> = async (data) => {
  //   // For twoFactor step, read from watched values (not from data)
  //   const identifier =
  //     step === 'twoFactor'
  //       ? (identifierValue as string)
  //       : ((data.identifier as string) ?? '');

  //   const password =
  //     step === 'twoFactor'
  //       ? (passwordValue as string)
  //       : ((data.password as string) ?? '');

  //   if (step === 'method') {
  //     setStep('form');
  //     setValue('method', selectedMethod);
  //     return;
  //   }

  //   let finalIdentifier = identifier;

  //   if (selectedMethod === 'phone') {
  //     const formattedPhone = formatPhoneNumberToE164(
  //       phoneInput,
  //       phoneDialCode ?? undefined,
  //     );

  //     if (!formattedPhone) {
  //       setPhoneError('Enter a valid phone number.');
  //       setIdentifierError('A valid phone number is required.');
  //       return;
  //     }

  //     finalIdentifier = formattedPhone;
  //     setPhoneError(null);
  //   } else if (!finalIdentifier) {
  //     setIdentifierError('Email is required.');
  //     return;
  //   }

  //   if (!password) {
  //     setIdentifierError(null);
  //     toast.error('Password is required.');
  //     return;
  //   }

  //   // 👉 2FA step: we already have email/phone + password, now send the TOTP
  //   if (step === 'twoFactor') {
  //     if (!twoFactorCode.trim() || twoFactorCode.trim().length < 6) {
  //       setTwoFactorError('Enter the 6-digit code from your authenticator app.');
  //       return;
  //     }

  //     setTwoFactorError(null);
  //     setIsLoading(true);

  //     const callback = await signIn('credentials', {
  //       identifier: finalIdentifier,
  //       password,
  //       method: selectedMethod,
  //       totpCode: twoFactorCode.trim(),
  //       redirect: false,
  //     });

  //     setIsLoading(false);

  //     if (callback?.ok) {
  //       toast.success('Benvenuto!', {
  //         iconTheme: {
  //           primary: '#2200ffff',
  //           secondary: '#fff',
  //         },
  //       });

  //       await getSession();
  //       setNeedsTwoFactor(false);
  //       setTwoFactorCode('');
  //       setTwoFactorError(null);
  //       router.refresh();
  //       loginModal.onClose();
  //       return;
  //     }

  //     if (callback?.error) {
  //       const message = callback.error || 'Invalid two-factor code.';
  //       setTwoFactorError(message);
  //       toast.error(message);
  //       return;
  //     }

  //     toast.error('Unable to sign in right now.');
  //     return;
  //   }

  //   // 👉 Normal form step: first credential check, without TOTP
  //   setTwoFactorError(null);
  //   setIdentifierError(null);
  //   setIsLoading(true);

  //   const callback = await signIn('credentials', {
  //     identifier: finalIdentifier,
  //     password,
  //     method: selectedMethod,
  //     redirect: false,
  //   });

  //   setIsLoading(false);

  //   if (callback?.ok) {
  //     toast.success('Benvenuto!', {
  //       iconTheme: {
  //         primary: '#2200ffff',
  //         secondary: '#fff',
  //       },
  //     });

  //     await getSession();
  //     setNeedsTwoFactor(false);
  //     setTwoFactorCode('');
  //     setTwoFactorError(null);
  //     router.refresh();
  //     loginModal.onClose();
  //     return;
  //   }

  //   if (callback?.error) {
  //     const message = callback.error;

  //     if (
  //       message.includes('Two-factor code required') ||
  //       message.toLowerCase().includes('two-factor')
  //     ) {
  //       setNeedsTwoFactor(true);
  //       setTwoFactorError(null);
  //       setTwoFactorCode('');
  //       setStep('twoFactor');
  //       toast.error('Two-factor authentication is enabled. Enter your 6-digit code.');
  //       return;
  //     }

  //     toast.error(message);
  //   } else {
  //     toast.error('Unable to sign in right now.');
  //   }
  // };
  
  const onSubmit = useCallback(
    async (data: FieldValues, codeOverride?: string) => {
      // For twoFactor step, read from watched values (not from data)
      const identifier =
        step === 'twoFactor'
          ? (identifierValue as string)
          : ((data.identifier as string) ?? '');

      const password =
        step === 'twoFactor'
          ? (passwordValue as string)
          : ((data.password as string) ?? '');

      if (step === 'method') {
        setStep('form');
        setValue('method', selectedMethod);
        return;
      }

      let finalIdentifier = identifier;

      if (selectedMethod === 'phone') {
        const formattedPhone = formatPhoneNumberToE164(
          phoneInput,
          phoneDialCode ?? undefined,
        );

        if (!formattedPhone) {
          setPhoneError('Enter a valid phone number.');
          setIdentifierError('A valid phone number is required.');
          return;
        }

        finalIdentifier = formattedPhone;
        setPhoneError(null);
      } else if (!finalIdentifier) {
        setIdentifierError('Email is required.');
        return;
      }

      if (!password) {
        setIdentifierError(null);
        toast.error('Password is required.');
        return;
      }

      // 👉 2FA step: we already have email/phone + password, now send the TOTP
      if (step === 'twoFactor') {
        const currentCode = (codeOverride ?? twoFactorCode).trim();

        if (!currentCode || currentCode.length < 6) {
          setTwoFactorError('Enter the 6-digit code from your authenticator app.');
          return;
        }

        setTwoFactorError(null);
        setIsLoading(true);

        const callback = await signIn('credentials', {
          identifier: finalIdentifier,
          password,
          method: selectedMethod,
          totpCode: currentCode,
          redirect: false,
        });

        setIsLoading(false);

        if (callback?.ok) {
          toast.success('Benvenuto!', {
            iconTheme: {
              primary: '#2200ffff',
              secondary: '#fff',
            },
          });

          await getSession();
          setNeedsTwoFactor(false);
          setTwoFactorCode('');
          setTwoFactorError(null);
          router.refresh();
          loginModal.onClose();
          return;
        }

        if (callback?.error) {
          const message = callback.error || 'Invalid two-factor code.';
          setTwoFactorError(message);
          toast.error(message);
          return;
        }

        toast.error('Unable to sign in right now.');
        return;
      }

      // 👉 Normal form step: first credential check, without TOTP
      setTwoFactorError(null);
      setIdentifierError(null);
      setIsLoading(true);

      const callback = await signIn('credentials', {
        identifier: finalIdentifier,
        password,
        method: selectedMethod,
        redirect: false,
      });

      setIsLoading(false);

      if (callback?.ok) {
        toast.success('Benvenuto!', {
          iconTheme: {
            primary: '#2200ffff',
            secondary: '#fff',
          },
        });

        await getSession();
        setNeedsTwoFactor(false);
        setTwoFactorCode('');
        setTwoFactorError(null);
        router.refresh();
        loginModal.onClose();
        return;
      }

      if (callback?.error) {
        const message = callback.error;

        if (
          message.includes('Two-factor code required') ||
          message.toLowerCase().includes('two-factor')
        ) {
          setNeedsTwoFactor(true);
          setTwoFactorError(null);
          setTwoFactorCode('');
          setStep('twoFactor');
          toast.error('Two-factor authentication is enabled. Enter your 6-digit code.');
          return;
        }

        toast.error(message);
      } else {
        toast.error('Unable to sign in right now.');
      }
    },
    [
      identifierValue,
      passwordValue,
      step,
      selectedMethod,
      phoneInput,
      phoneDialCode,
      twoFactorCode,
      setValue,
      toast,
      getSession,
      router,
      loginModal,
    ],
  );

  const handleFormSubmit: SubmitHandler<FieldValues> = (data) => onSubmit(data);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      await signIn('google', { callbackUrl: '/' });
    } catch (error) {
      console.error(error);
      toast.error('Google login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const bodyContent = (
    <div className="flex flex-col gap-5">
      <AnimatePresence mode="wait">
        {step === 'method' && (
          <motion.div
            key="method-step"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.25 }}
            className="flex flex-col gap-5"
          >
            <Heading
              title="How would you like to sign in?"
              subtitle="Choose your preferred method and continue."
              center
            />
            <div className="grid gap-3 sm:grid-cols-2">
              {methodOptions.map((option) => {
                const active = selectedMethod === option.key;
                return (
                  <motion.button
                    key={option.key}
                    type="button"
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setSelectedMethod(option.key as AuthMethod);
                      setStep('form');
                      setIdentifierError(null);
                      setPhoneError(null);
                    }}
                    className={`
                      flex h-full flex-col gap-2 text-neutral-800 rounded-2xl p-4 text-left transition
                      ${
                        active
                          ? 'bg-sky-50/60 text-neutral-800 shadow-md shadow-neutral-900/20'
                          : 'bg-white text-neutral-800 shadow-md hover:border-neutral-400 hover:shadow-lg'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`aspect-square flex h-10 w-10 items-center justify-center rounded-xl text-base font-medium ${
                          active ? 'bg-white/50 text-neutral-800' : 'bg-sky-50/60 text-neutral-800'
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
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}

        {step === 'form' && (
          <motion.div
            key={`form-${selectedMethod}`}
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.25 }}
            className="flex flex-col gap-4"
          >
            <Heading
              title={
                selectedMethod === 'email'
                  ? 'Welcome back'
                  : 'Sign in with your phone'
              }
              subtitle={
                selectedMethod === 'email'
                  ? 'Use the email and password associated with your Vinvin account.'
                  : 'Enter the phone number linked to your Vinvin account.'
              }
            />
            {selectedMethod === 'email' ? (
              <div className="flex flex-row md:flex-col gap-2">
                <div className='flex flex-row w-full'>
                    <Input
                    id="identifier"
                    label="Email"
                    type="email"
                    disabled={isLoading}
                    register={register}
                    errors={errors}
                    required
                    inputClassName="h-14 rounded-xl"
                    />
                    {identifierError && (
                    <p className="text-xs text-rose-500">{identifierError}</p>
                    )}
                </div>
              </div>
            ) : (
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
                hint={
                  phoneDialCode
                    ? `Include only the local part. We’ll use ${phoneDialCode} automatically.`
                    : undefined
                }
                inputId="login-phone"
              />
            )}
            <Input
              id="password"
              label="Password"
              type="password"
              disabled={isLoading}
              register={register}
              errors={errors}
              required
              withVisibilityToggle
              inputClassName="h-14 rounded-xl"
            />

            <button
              type="button"
              onClick={() => {
                loginModal.onClose();
                forgetPasswordModal.onOpen();
              }}
              className="self-start text-sm font-medium text-neutral-600 underline-offset-4 transition hover:text-neutral-900 hover:underline"
            >
              Need help signing in?
            </button>
          </motion.div>
        )}

       {step === 'twoFactor' && (
          <motion.div
            key="twofactor-step"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.25 }}
            className="flex flex-col gap-4"
          >
            <Heading
              title="Enter your 6-digit code"
              subtitle="Open your authenticator app and type the code to complete sign in."
            />

            <div className="flex justify-center">
              <div className="relative">
                {/* Visual boxes */}
                <div className="flex gap-2 sm:gap-3">
                  {Array.from({ length: 6 }).map((_, index) => {
                    const digit = twoFactorCode[index] ?? '';

                    return (
                      <motion.div
                        key={index}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ duration: 0.15, delay: index * 0.03 }}
                        className={`
                          flex h-12 w-10 items-center justify-center rounded-xl border text-lg font-semibold
                          sm:h-14 sm:w-12
                          ${
                            digit
                              ? 'border-black bg-black text-white'
                              : 'border-neutral-300 bg-white text-neutral-800'
                          }
                        `}
                      >
                        <AnimatePresence mode="popLayout" initial={false}>
                          {digit ? (
                            <motion.span
                              key={`digit-${index}-${digit}`}
                              initial={{ scale: 0.4, opacity: 0, y: 6 }}
                              animate={{ scale: 1, opacity: 1, y: 0 }}
                              exit={{ scale: 0.6, opacity: 0, y: -4 }}
                              transition={{ duration: 0.15 }}
                            >
                              {digit}
                            </motion.span>
                          ) : (
                            <motion.span
                              key={`placeholder-${index}`}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 0.4 }}
                              exit={{ opacity: 0 }}
                              className="text-neutral-400"
                            >
                              •
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Single invisible input catching all typing */}
                <input
                  type="tel"
                  inputMode="numeric"
                  autoFocus
                  maxLength={6}
                  value={twoFactorCode}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setTwoFactorCode(clean);

                    // Auto-submit when 6 digits are entered
                    if (clean.length === 6 && !isLoading) {
                      void onSubmit(
                        {
                          identifier: identifierValue,
                          password: passwordValue,
                          method: selectedMethod,
                        } as FieldValues,
                        clean,
                      );
                    }
                  }}
                  className="absolute inset-0 h-full w-full cursor-text opacity-0 outline-none"
                  disabled={isLoading}
                />

              </div>
            </div>

            {twoFactorError && (
              <p className="text-xs text-center text-rose-500">{twoFactorError}</p>
            )}

            {/* <button
              type="button"
              onClick={() => {
                setStep('form');
                setTwoFactorError(null);
                setTwoFactorCode('');
              }}
              className="self-center text-xs font-medium text-neutral-600 underline-offset-4 transition hover:text-neutral-900 hover:underline"
            >
              Use a different method
            </button> */}
          </motion.div>
        )}

        {step === 'altOptions' && (
          <motion.div
            key="alt-options-step"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.25 }}
            className="flex flex-col gap-4"
          >
            {/* Top-left: back to login */}
            <div className="flex justify-start">
              <button
                type="button"
                onClick={() => setStep('method')}
                className="inline-flex items-center gap-2 self-start rounded-full px-4 py-2 text-sm font-medium text-neutral-700 border-b border-neutral-100 transition hover:border-neutral-200"
                    >
                    <HiMiniArrowLeft />
                    BACK TO SIGN IN
              </button>
            </div>

            <Button
              outline
              label="Continue with Google"
              icon={FcGoogle}
              onClick={handleGoogleLogin}
              disabled={isLoading}
            />

            <hr className='my-2 mx-2' />

            <div className="rounded-3xl bg-neutral-100 p-5 text-center text-neutral-800 shadow-lg mt-0">
              <p className="text-xs uppercase tracking-[0.35em] text-black/60">
                New on Vinvin?
              </p>
              <p className="mt-2 text-sm text-black/80">
                Create an account to unlock exclusive experiences tailored for you.
              </p>
              <button
                type="button"
                onClick={onToggleRegister}
                className="mt-4 inline-flex items-center justify-center rounded-full bg-white px-6 py-2 text-sm font-semibold text-neutral-900 shadow-md transition hover:bg-white/90"
              >
                Create an account
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const footerContent =
    step === 'altOptions'
      ? undefined
      : (
        <div className="mt-4 flex flex-col gap-4">
          <Button
            outline
            label="Use other options"
            onClick={() => setStep('altOptions')}
            disabled={isLoading}
          />
          <div className="flex items-center justify-center gap-2 text-xs text-neutral-500">
            <span>Don’t have an account?</span>
            <button
              type="button"
              onClick={onToggleRegister}
              className="font-semibold text-neutral-800 underline-offset-4 transition hover:underline"
            >
              Register
            </button>
          </div>
        </div>
  );

  return (
    <>
    <Modal
      disabled={isLoading}
      isOpen={loginModal.isOpen}
      title="Sign in"
      actionLabel={
        step === 'altOptions'
          ? ''
          : step === 'twoFactor'
          ? 'Verify & sign in'
          : step === 'form'
          ? 'Sign in'
          : 'Continue'
      }
      onClose={loginModal.onClose}
      onSubmit={step === 'altOptions' ? () => {} : handleSubmit(handleFormSubmit)}
      body={bodyContent}
      footer={footerContent}
      className=""
      secondaryAction={
        step === 'form'
          ? goBackToMethod
          : step === 'twoFactor'
          ? () => {
              setStep('form');
              setTwoFactorError(null);
              setTwoFactorCode('');
            }
          : undefined
      }
      secondaryActionLabel={
        step === 'form' || step === 'twoFactor' ? 'Back' : undefined
      }
      closeOnSubmit={false}
    />

      <ForgetPasswordModal />
    </>
  );
};

export default LoginModal;