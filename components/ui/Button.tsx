import { Pressable, Text, type PressableProps } from 'react-native';

type ButtonVariant = 'primary' | 'outline' | 'danger' | 'ghost';
type ButtonSize = 'default' | 'sm';

interface ButtonProps extends Omit<PressableProps, 'children'> {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-blue-600 active:bg-blue-700',
  outline: 'border border-blue-600 active:bg-blue-50',
  danger: 'border border-red-300 active:bg-red-50',
  ghost: '',
};

const variantTextClasses: Record<ButtonVariant, string> = {
  primary: 'text-white',
  outline: 'text-blue-600',
  danger: 'text-red-600',
  ghost: 'text-blue-600',
};

const sizeClasses: Record<ButtonSize, string> = {
  default: 'py-3',
  sm: 'py-2 px-6',
};

const sizeTextClasses: Record<ButtonSize, string> = {
  default: 'text-base',
  sm: 'text-sm',
};

const baseClasses = 'rounded-lg';
const baseTextClasses = 'text-center font-semibold';

export function Button({
  title,
  variant = 'primary',
  size = 'default',
  loading = false,
  disabled,
  className,
  ...props
}: ButtonProps) {
  return (
    <Pressable
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className ?? ''}`}
      disabled={disabled || loading}
      {...props}
    >
      <Text
        className={`${baseTextClasses} ${variantTextClasses[variant]} ${sizeTextClasses[size]}`}
      >
        {loading ? 'Loading...' : title}
      </Text>
    </Pressable>
  );
}
