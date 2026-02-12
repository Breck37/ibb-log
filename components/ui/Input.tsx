import React from 'react';
import { TextInput, type TextInputProps } from 'react-native';

type InputSize = 'default' | 'sm';

interface InputProps extends TextInputProps {
  size?: InputSize;
}

const sizeClasses: Record<InputSize, string> = {
  default: 'px-4 py-4 text-base',
  sm: 'px-3 py-2 text-sm',
};

const baseClasses =
  'rounded-lg border border-gray-300 dark:border-gray-600 dark:text-white';

export const Input = React.forwardRef<TextInput, InputProps>(
  ({ size = 'default', className, ...props }, ref) => {
    return (
      <TextInput
        ref={ref}
        className={`${baseClasses} ${sizeClasses[size]} ${className ?? ''}`}
        {...props}
      />
    );
  },
);

Input.displayName = 'Input';
