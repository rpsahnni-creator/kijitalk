import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { speechErrorMessage, speechService } from '@/lib/speech';

interface Props {
  /** Final transcript. */
  onText: (text: string) => void;
  /** Interim transcript while the user is still speaking. */
  onPartial?: (text: string) => void;
  size?: 'md' | 'lg';
  disabled?: boolean;
}

/**
 * Tap to talk, tap again to stop. Hidden entirely when the build has no
 * speech-to-text (Expo Go), so screens fall back to their text input.
 */
export function MicButton({ onText, onPartial, size = 'md', disabled }: Props) {
  const [listening, setListening] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => () => speechService.cancelListening(), []);

  if (!speechService.canListen) return null;

  const toggle = () => {
    if (listening) {
      speechService.stopListening();
      return;
    }
    setNote('');
    setListening(true);
    void speechService.startListening(
      (text) => {
        setListening(false);
        onText(text);
      },
      (code) => {
        setListening(false);
        setNote(speechErrorMessage(code));
      },
      onPartial
    );
  };

  const dim = size === 'lg' ? 'h-16 w-16' : 'h-12 w-12';
  return (
    <View className="items-center">
      <TouchableOpacity
        onPress={toggle}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={listening ? 'Stop recording' : 'Bolkar likho'}
        className={`${dim} items-center justify-center rounded-full ${listening ? 'bg-red-500' : 'bg-leaf-700'} ${disabled ? 'opacity-50' : ''}`}
      >
        {listening ? <Ionicons name="stop" size={size === 'lg' ? 26 : 20} color="#fff" /> : <Ionicons name="mic" size={size === 'lg' ? 28 : 22} color="#fff" />}
      </TouchableOpacity>
      {listening && (
        <View className="mt-1 flex-row items-center gap-1">
          <ActivityIndicator size="small" color="#dc143c" />
          <Text className="text-xs text-brand-600">Sun rahe hain…</Text>
        </View>
      )}
      {!!note && <Text className="mt-1 max-w-[220px] text-center text-xs text-red-600">{note}</Text>}
    </View>
  );
}
