import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div
        className="
          relative w-full sm:max-w-md mx-auto
          bg-white rounded-t-3xl sm:rounded-3xl
          ios-shadow-lg animate-slide-up
          max-h-[90vh] overflow-auto
          safe-area-bottom
        "
      >
        {/* Header */}
        {title && (
          <div className="sticky top-0 bg-white/90 backdrop-blur-md px-6 py-4 border-b border-ios-gray-5 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-ios-gray-5 flex items-center justify-center text-ios-gray-1 hover:bg-ios-gray-4 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  isVisible: boolean;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  isVisible,
}) => {
  if (!isVisible) return null;

  const bgColors = {
    success: 'bg-ios-green',
    error: 'bg-ios-red',
    info: 'bg-gray-800',
  };

  return (
    <div className="fixed top-12 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
      <div
        className={`
          ${bgColors[type]} text-white
          px-6 py-3 rounded-full
          ios-shadow-lg
          font-medium text-sm
        `}
      >
        {message}
      </div>
    </div>
  );
};
