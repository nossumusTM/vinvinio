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
  const [step, setStep] = useState<'method' | 'form'>('method');
  const [selectedMethod, setSelectedMethod] = useState<AuthMethod>('email');
  const [phoneCountry, setPhoneCountry] = useState('IT');
  const [phoneInput, setPhoneInput] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [identifierError, setIdentifierError] = useState<string | null>(null);
  const [emailValue, setEmailValue] = useState('');

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
    },
  });

  const identifierValue = watch('identifier');

  useEffect(() => {
    if (selectedMethod === 'email') {
      setEmailValue(identifierValue ?? '');
    }
  }, [identifierValue, selectedMethod]);

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
    setEmailValue('');
    reset({ identifier: '', password: '', method: 'email' });
  }, [loginModal.isOpen, reset]);

  useEffect(() => {
    setValue('method', selectedMethod);

    if (selectedMethod === 'email') {
      setValue('identifier', emailValue);
      return;
    }

    const formatted = formatPhoneNumberToE164(phoneInput, phoneDialCode ?? undefined) ?? '';
    setValue('identifier', formatted);
  }, [selectedMethod, setValue, phoneInput, phoneDialCode, emailValue]);

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

  const onSubmit: SubmitHandler<FieldValues> = async (data) => {
    if (step === 'method') {
      setStep('form');
      setValue('method', selectedMethod);
      return;
    }

    let identifier = data.identifier as string;

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

      identifier = formattedPhone;
      setPhoneError(null);
    } else if (!identifier) {
      setIdentifierError('Email is required.');
      return;
    }

    if (!data.password) {
      setIdentifierError(null);
      toast.error('Password is required.');
      return;
    }

    setIdentifierError(null);
    setIsLoading(true);

    const callback = await signIn('credentials', {
      identifier,
      password: data.password,
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
      router.refresh();
      loginModal.onClose();
      return;
    }

    if (callback?.error) {
      toast.error(callback.error);
    } else {
      toast.error('Unable to sign in right now.');
    }
  };

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
        {step === 'method' ? (
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
                    onClick={() => setSelectedMethod(option.key)}
                    className={`
                      flex h-full flex-col gap-2 rounded-2xl border p-4 text-left transition
                      ${active
                        ? 'border-black bg-neutral-900 text-white shadow-lg shadow-neutral-900/20'
                        : 'border-neutral-200 bg-white text-neutral-800 shadow-sm hover:border-neutral-400 hover:shadow-md'}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`aspect-square flex h-10 w-10 items-center justify-center rounded-xl text-base font-medium ${
                          active ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-800'
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
        ) : (
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
                  ? 'Use the email and password associated with your Vuola account.'
                  : 'Enter the phone number linked to your Vuola account.'
              }
            />
            {selectedMethod === 'email' ? (
              <div className="flex flex-col gap-2">
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
      </AnimatePresence>
    </div>
  );

  const footerContent = (
    <div className="mt-4 flex flex-col gap-4">
      <hr className="border-neutral-200" />
      <Button
        outline
        label="Continue with Google"
        icon={FcGoogle}
        onClick={handleGoogleLogin}
        disabled={isLoading}
      />
      <div className="rounded-3xl bg-gradient-to-br from-neutral-900 via-neutral-800 to-black p-5 text-center text-white shadow-lg">
        <p className="text-xs uppercase tracking-[0.35em] text-white/60">New on Vuola?</p>
        <p className="mt-2 text-sm text-white/80">
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
    </div>
  );

  return (
    <>
      <Modal
        disabled={isLoading}
        isOpen={loginModal.isOpen}
        title="Sign in"
        actionLabel={step === 'form' ? 'Sign in' : 'Continue'}
        onClose={loginModal.onClose}
        onSubmit={handleSubmit(onSubmit)}
        body={bodyContent}
        footer={footerContent}
        className=""
        secondaryAction={step === 'form' ? goBackToMethod : undefined}
        secondaryActionLabel={step === 'form' ? 'Back' : undefined}
        closeOnSubmit={false}
      />
      <ForgetPasswordModal />
    </>
  );
};

export default LoginModal;