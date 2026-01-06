/**
 * Voice input button component with visual feedback
 */
import React from 'react';
import { Mic, MicOff } from 'lucide-react';
import type { Translation } from '../../types';

interface VoiceInputButtonProps {
  isListening: boolean;
  isSupported: boolean;
  onStart: () => void;
  onStop: () => void;
  t: Translation['chatbot'];
  disabled?: boolean;
}

export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  isListening,
  isSupported,
  onStart,
  onStop,
  t,
  disabled = false,
}) => {
  if (!isSupported) {
    return (
      <button
        type="button"
        disabled
        className="p-1.5 text-neutral-300 cursor-not-allowed"
        title={t.voiceNotSupported}
      >
        <MicOff className="w-5 h-5" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={isListening ? onStop : onStart}
      disabled={disabled}
      className={`p-1.5 transition-all rounded-full ${
        isListening
          ? 'text-red-500 bg-red-50 animate-pulse'
          : 'text-neutral-400 hover:text-primary-500 hover:bg-primary-50'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      title={isListening ? t.voiceListening : t.voiceInput}
      aria-label={isListening ? t.voiceListening : t.voiceInput}
    >
      <Mic className="w-5 h-5" />
      {isListening && (
        <span className="absolute -top-1 -right-1 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
        </span>
      )}
    </button>
  );
};
