'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoMdClose } from 'react-icons/io';
import Button from '../Button';

interface ModalProps {
  isOpen?: boolean;
  onClose: () => void;
  onSubmit: () => void;
  closeOnSubmit?: boolean;
  actionLoading?: boolean;
  title?: string;
  body?: React.ReactElement;
  footer?: React.ReactElement;
  actionLabel: string;
  disabled?: boolean;
  secondaryAction?: () => void;
  secondaryActionLabel?: string;
  className: string;
  submitOnEnter?: boolean;
  preventOutsideClose?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  actionLoading = false,
  title,
  body,
  actionLabel,
  footer,
  disabled,
  secondaryAction,
  secondaryActionLabel,
  closeOnSubmit = true,
  className,
  submitOnEnter = true,
  preventOutsideClose = false,
}) => {
  const [showModal, setShowModal] = useState(isOpen);
  const modalRef = useRef<HTMLDivElement>(null);

  const [exitIntent, setExitIntent] = useState<'close' | 'submit' | null>(null);

  useEffect(() => {
    setShowModal(isOpen);
  }, [isOpen]);

  const handleClose = useCallback(() => {
    if (disabled) return;
    setExitIntent('close');
    setShowModal(false);
  }, [disabled]);

  // Outside click to close
  useEffect(() => {
    if (preventOutsideClose) {
      return;
    }

    const handleOutsideClick = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen, preventOutsideClose, handleClose]);

   const handleSubmit = useCallback(() => {
    if (disabled) return;
    if (!closeOnSubmit) {
      // intermediate step: DON'T close, just run submit
      onSubmit();
      return;
    }
    // final step: animate out, then submit
    setExitIntent('submit');
    setShowModal(false);
  }, [disabled, closeOnSubmit, onSubmit]);

  const handleSecondaryAction = useCallback(() => {
    if (disabled || !secondaryAction) return;
    secondaryAction();
  }, [secondaryAction, disabled]);

  useEffect(() => {
    if (!submitOnEnter) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        handleSubmit();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleSubmit, submitOnEnter]);

  // if (!isOpen) return null;

  if (!isOpen && !showModal) return null;

  return (
    <div
      className="
        justify-center 
        items-center 
        flex 
        overflow-x-hidden 
        overflow-y-auto 
        fixed 
        inset-0 
        z-50 
        outline-none 
        focus:outline-none
        bg-black/30
        backdrop-blur-sm
        p-5
      "
    >
      <div
        className="
          relative 
          w-full
          md:w-4/6
          lg:w-3/6
          xl:w-2/5
          my-6
          mx-auto 
          h-auto 
          lg:h-auto
          md:h-full
        "
      >
        <AnimatePresence
          initial={false}
          onExitComplete={() => {
            if (exitIntent === 'submit') {
              // hide overlay in parent, then run submit logic
              onClose();
              onSubmit();
            } else if (exitIntent === 'close') {
              onClose();
            }
            // reset
            setExitIntent(null);
          }}>
          {showModal && (
            <motion.div
                key="modal-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="h-full"
                onMouseDown={(e) => {
                  if (preventOutsideClose) {
                    return;
                  }

                  if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
                    handleClose(); // animated close on outside click
                  }
                }}
              >
              <motion.div
                ref={modalRef}
                initial={{ scale: 0.96, y: 8, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.96, y: 8, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 420, damping: 32, mass: 0.55 }}
                className="
                  h-full
                  lg:h-auto
                  md:h-auto
                  border-0 
                  rounded-3xl 
                  shadow-lg 
                  relative 
                  flex 
                  flex-col 
                  w-full 
                  bg-white
                  outline-none 
                  focus:outline-none
                  will-change-transform
                "
              >
               {/* bg-gradient-to-br from-rose-100 via-white to-sky-100 */}

                {/* Header */}
                <div
                  className="
                    flex 
                    items-center 
                    p-6
                    rounded-t
                    justify-center
                    relative
                    border-b-[1px]
                  "
                >
                  <button
                    className="
                      p-1
                      border-0 
                      hover:opacity-70
                      transition
                      absolute
                      left-9
                    "
                    onClick={handleClose}
                  >
                    <IoMdClose size={18} />
                  </button>
                  <div className="text-lg font-semibold">{title}</div>
                </div>
  
                {/* Body */}
                <div className={`relative p-6 flex-auto overflow-y-auto ${className}`}>
                  {body}
                </div>
  
                {/* Footer */}
                {/* <div className="flex flex-col gap-2 p-6">
                  <div className="flex flex-row items-center gap-4 w-full">
                    {secondaryAction && secondaryActionLabel && (
                      <Button
                        disabled={disabled}
                        label={secondaryActionLabel}
                        onClick={handleSecondaryAction}
                        outline
                      />
                    )}
                    {actionLabel.trim() !== '' && (
                    <Button
                      disabled={disabled}
                      label={actionLabel}
                      onClick={onSubmit}
                    />
                  )}
                  </div>
                  {footer}
                </div> */}

                {(footer || actionLabel.trim() !== '' || (secondaryAction && secondaryActionLabel)) && (
                  <div className="flex flex-col gap-2 p-6">
                    <div className="flex flex-row items-center gap-4 w-full">
                      {secondaryAction && secondaryActionLabel && (
                        <Button
                          disabled={disabled}
                          label={secondaryActionLabel}
                          onClick={handleSecondaryAction}
                          outline
                        />
                      )}
                      {actionLabel.trim() !== '' && (
                        <Button
                          disabled={disabled}
                          label={actionLabel}
                          loading={actionLoading}
                          onClick={onSubmit}
                        />
                      )}
                    </div>
                    {footer}
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );  
};

export default Modal;
