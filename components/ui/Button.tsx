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
  primary: 'bg-primary active:bg-primary-dim',
  outline: 'border border-primary active:bg-primary/10',
  danger: 'border border-primary/60 active:bg-primary/10',
  ghost: '',
};

const variantTextClasses: Record<ButtonVariant, string> = {
  primary: 'text-white',
  outline: 'text-primary',
  danger: 'text-primary',
  ghost: 'text-forge-muted',
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
const baseTextClasses = 'text-center font-semibold tracking-wide';

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
