import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-ios-gray-1">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`
              w-full px-4 py-3.5 rounded-2xl
              bg-ios-gray-6 border-2 border-transparent
              text-gray-900 placeholder-ios-gray-2
              transition-all duration-200
              focus:border-ios-blue focus:bg-white
              ${icon ? 'pl-12' : ''}
              ${error ? 'border-ios-red bg-red-50' : ''}
              ${className}
            `}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1.5 text-sm text-ios-red ml-1">{error}</p>
        )}
        {hint && !error && (
          <p className="mt-1.5 text-sm text-ios-gray-1 ml-1">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, hint, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1.5 ml-1">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`
            w-full px-4 py-3.5 rounded-2xl
            bg-ios-gray-6 border-2 border-transparent
            text-gray-900 placeholder-ios-gray-2
            transition-all duration-200 resize-none
            focus:border-ios-blue focus:bg-white
            ${error ? 'border-ios-red bg-red-50' : ''}
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-sm text-ios-red ml-1">{error}</p>
        )}
        {hint && !error && (
          <p className="mt-1.5 text-sm text-ios-gray-1 ml-1">{hint}</p>
        )}
      </div>
    );
  }
);

TextArea.displayName = 'TextArea';
