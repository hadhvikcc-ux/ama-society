import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';

interface ButtonProps {
  onPress: () => void;
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
}

export function Button({ onPress, title, variant = 'primary', loading, disabled, fullWidth = true }: ButtonProps) {
  const getBgColor = () => {
    if (disabled) return 'bg-gray-300';
    switch (variant) {
      case 'primary': return 'bg-[#1B4FD8]';
      case 'secondary': return 'bg-gray-200';
      case 'danger': return 'bg-red-600';
      case 'outline': return 'bg-transparent border border-[#1B4FD8]';
      default: return 'bg-[#1B4FD8]';
    }
  };

  const getTextColor = () => {
    if (disabled) return 'text-gray-500';
    if (variant === 'outline') return 'text-[#1B4FD8]';
    if (variant === 'secondary') return 'text-gray-800';
    return 'text-white';
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      className={`${getBgColor()} p-4 rounded-lg items-center justify-center flex-row ${fullWidth ? 'w-full' : ''}`}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? '#1B4FD8' : '#ffffff'} className="mr-2" />
      ) : null}
      <Text className={`${getTextColor()} font-bold text-base`}>{title}</Text>
    </TouchableOpacity>
  );
}
