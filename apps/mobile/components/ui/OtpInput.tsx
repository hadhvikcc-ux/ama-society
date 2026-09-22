import React, { useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';

interface OtpInputProps {
  length?: number;
  onComplete: (code: string) => void;
  autoFocus?: boolean;
}

export const OtpInput = forwardRef(({ length = 6, onComplete, autoFocus = true }: OtpInputProps, ref) => {
  const [code, setCode] = useState<string[]>(new Array(length).fill(''));
  const inputs = useRef<TextInput[]>([]);

  useImperativeHandle(ref, () => ({
    clear: () => {
      setCode(new Array(length).fill(''));
      inputs.current[0]?.focus();
    }
  }));

  const handleChange = (text: string, index: number) => {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    if (text && index < length - 1) {
      inputs.current[index + 1]?.focus();
    }
    
    if (newCode.every(c => c !== '')) {
      onComplete(newCode.join(''));
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.container}>
      {code.map((char, index) => (
        <TextInput
          key={index}
          ref={(ref) => { if (ref) inputs.current[index] = ref; }}
          style={styles.input}
          keyboardType="numeric"
          maxLength={1}
          value={char}
          onChangeText={(text) => handleChange(text, index)}
          onKeyPress={(e) => handleKeyPress(e, index)}
          autoFocus={autoFocus && index === 0}
        />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  container: { flexDirection: 'row', justifyContent: 'center', gap: 10 },
  input: { width: 45, height: 55, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, fontSize: 24, textAlign: 'center', backgroundColor: 'white', color: 'black' },
});
