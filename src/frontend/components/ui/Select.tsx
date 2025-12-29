import React from 'react';

interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

interface SelectProps {
  label?: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  error?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  value,
  options,
  onChange,
  error,
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2 ml-1">
          {label}
        </label>
      )}
      <div className="space-y-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`
              w-full p-4 rounded-2xl text-left transition-all duration-200
              ios-press
              ${
                value === option.value
                  ? 'bg-ios-blue text-white'
                  : 'bg-ios-gray-6 text-gray-900 hover:bg-ios-gray-5'
              }
            `}
          >
            <div className="font-medium">{option.label}</div>
            {option.description && (
              <div
                className={`text-sm mt-0.5 ${
                  value === option.value ? 'text-blue-100' : 'text-ios-gray-1'
                }`}
              >
                {option.description}
              </div>
            )}
          </button>
        ))}
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-ios-red ml-1">{error}</p>
      )}
    </div>
  );
};
