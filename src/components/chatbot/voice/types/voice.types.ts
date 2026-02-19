export type VoicePermissionState = 'granted' | 'denied' | 'prompt' | 'unsupported';

export type VoiceState = {
  isRecording: boolean;
  isProcessing: boolean;
  currentTranscript: string;
  audioLevel: number;
  permissions: {
    microphone: VoicePermissionState;
  };
};

export type UseAudioRecordingOptions = {
  maxDuration?: number;
  maxBlobSize?: number;
};

export type UseAudioRecordingReturn = {
  state: VoiceState;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<Blob>;
  requestPermission: () => Promise<VoicePermissionState>;
  getSupportedMimeType: () => string;
};
