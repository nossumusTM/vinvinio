'use client';

import React from 'react';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfirmPopupProps {
  title?: string;
  message?: React.ReactNode;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  hideCancel?: boolean;
  type?: 'success' | 'error' | 'info';
  hideActions?: boolean; // ← NEW
}

const ConfirmPopup: React.FC<ConfirmPopupProps> = ({
  title = 'Confirm Action',
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  hideCancel = false,
  hideActions = false,
}) => {

  const popupRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onCancel?.(); // triggers closing
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [onCancel]);

  const handleConfirm = async () => {
    if (!onConfirm) return;
    setIsLoading(true);
    await onConfirm();
    setIsLoading(false);
    onCancel?.(); // Close popup after confirmation
  };

  return (
    <AnimatePresence>
      <motion.div
        key="confirm-popup"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        // className="p-4 fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm"
        className="p-4 fixed inset-0 z-50 flex items-center justify-center"
      >
        <motion.div
          key="popup-content"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.25 }}
          ref={popupRef}
          className="bg-white p-6 rounded-xl max-w-sm w-full shadow-lg"
        >
          <h3 className="text-lg font-semibold mb-2">{title}</h3>
          {message && <p className="text-sm text-neutral-700 mb-6">{message}</p>}
  
          {!hideActions && (
            <div className="flex justify-end gap-3">
              {!hideCancel && (
                <button
                  onClick={onCancel}
                  className="px-4 py-2 border border-neutral-400 rounded-xl hover:bg-neutral-100 transition"
                >
                  {cancelLabel}
                </button>
              )}
             <button
                onClick={async () => {
                  if (onConfirm) {
                    setIsLoading(true);
                    await onConfirm();         // Wait for the async action
                    setIsLoading(false);
                    onCancel?.();              // Close the popup AFTER toast
                  }
                }}
                disabled={isLoading}
                className="px-4 py-2 bg-black text-white rounded-xl hover:opacity-90 transition flex items-center justify-center min-w-[100px]"
              >
                {isLoading ? (
                  <span className="loader inline-block w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></span>
                ) : (
                  confirmLabel
                )}
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );  
};

export default ConfirmPopup;
