import { View, Text, TextInput, TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, ...props }: InputProps) {
  return (
    <View className="w-full mb-4">
      {label && <Text className="text-gray-700 mb-1">{label}</Text>}
      <TextInput
        className={`w-full border rounded-lg p-4 text-base ${error ? 'border-red-500' : 'border-gray-300'}`}
        placeholderTextColor="#9ca3af"
        {...props}
      />
      {error && <Text className="text-red-500 text-sm mt-1">{error}</Text>}
    </View>
  );
}
