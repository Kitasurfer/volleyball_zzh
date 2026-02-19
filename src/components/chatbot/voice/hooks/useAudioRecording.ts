import { useState, useCallback, useRef, useEffect } from 'react';
import {
  VoiceState,
  VoicePermissionState,
  UseAudioRecordingOptions,
  UseAudioRecordingReturn,
} from '../types/voice.types';
import { VOICE_CONSTANTS, SUPPORTED_MIME_TYPES } from '../lib/constants';

const initialState: VoiceState = {
  isRecording: false,
  isProcessing: false,
  currentTranscript: '',
  audioLevel: 0,
  permissions: {
    microphone: 'prompt',
  },
};

export const getSupportedMimeType = (): string => {
  const supported = SUPPORTED_MIME_TYPES.find((type) =>
    MediaRecorder.isTypeSupported(type)
  );

  if (!supported) {
    throw new Error('Browser does not support audio recording');
  }

  return supported;
};

export const useAudioRecording = (
  options?: UseAudioRecordingOptions
): UseAudioRecordingReturn => {
  const maxDuration = options?.maxDuration ?? VOICE_CONSTANTS.MAX_RECORDING_DURATION;
  const maxBlobSize = options?.maxBlobSize ?? VOICE_CONSTANTS.MAX_BLOB_SIZE;

  const [state, setState] = useState<VoiceState>(initialState);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const stopTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isRecordingRef = useRef<boolean>(false);
  const resolveBlobRef = useRef<((blob: Blob) => void) | null>(null);
  const rejectBlobRef = useRef<((error: Error) => void) | null>(null);

  const cleanupAudioContext = useCallback(() => {
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }

    if (analyserRef.current) {
      analyserRef.current.disconnect();
      analyserRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }, []);

  const cleanup = useCallback(() => {
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    cleanupAudioContext();
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
    isRecordingRef.current = false;
  }, [cleanupAudioContext]);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const updateAudioLevel = useCallback(() => {
    if (!analyserRef.current || !isRecordingRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
    const level = Math.min(100, (average / 256) * 100);

    setState((prev) => ({ ...prev, audioLevel: level }));

    if (isRecordingRef.current) {
      animationFrameIdRef.current = requestAnimationFrame(updateAudioLevel);
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<VoicePermissionState> => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setState((prev) => ({
        ...prev,
        permissions: { microphone: 'unsupported' },
      }));
      return 'unsupported';
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());

      setState((prev) => ({
        ...prev,
        permissions: { microphone: 'granted' },
      }));
      return 'granted';
    } catch (error) {
      const permissionState: VoicePermissionState =
        (error as Error).name === 'NotAllowedError' ? 'denied' : 'prompt';

      setState((prev) => ({
        ...prev,
        permissions: { microphone: permissionState },
      }));
      return permissionState;
    }
  }, []);

  const startRecording = useCallback(async (): Promise<void> => {
    if (isRecordingRef.current) {
      console.warn('Recording already in progress');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      setState((prev) => ({
        ...prev,
        isRecording: true,
        permissions: { microphone: 'granted' },
        audioLevel: 0,
      }));

      const mimeType = getSupportedMimeType();
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      isRecordingRef.current = true;

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const analyser = audioContext.createAnalyser();
      analyserRef.current = analyser;
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      updateAudioLevel();

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);

          const totalSize = audioChunksRef.current.reduce(
            (acc, chunk) => acc + chunk.size,
            0
          );
          if (totalSize > maxBlobSize) {
            console.warn('Max blob size exceeded, stopping recording');
            mediaRecorder.stop();
          }
        }
      };

      mediaRecorder.onstop = () => {
        const mimeType = getSupportedMimeType();
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

        cleanup();
        setState((prev) => ({ ...prev, isRecording: false, audioLevel: 0 }));

        if (resolveBlobRef.current) {
          resolveBlobRef.current(audioBlob);
          resolveBlobRef.current = null;
          rejectBlobRef.current = null;
        }
      };

      mediaRecorder.onerror = (event) => {
        cleanup();
        setState((prev) => ({ ...prev, isRecording: false, audioLevel: 0 }));

        if (rejectBlobRef.current) {
          rejectBlobRef.current(new Error('Recording failed'));
          resolveBlobRef.current = null;
          rejectBlobRef.current = null;
        }
      };

      stopTimerRef.current = setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          console.log('Max duration reached, stopping recording');
          mediaRecorderRef.current.stop();
        }
      }, maxDuration);

      mediaRecorder.start(1000);
    } catch (error) {
      cleanup();
      const permissionState: VoicePermissionState =
        (error as Error).name === 'NotAllowedError' ? 'denied' : 'prompt';

      setState((prev) => ({
        ...prev,
        isRecording: false,
        permissions: { microphone: permissionState },
      }));

      throw error;
    }
  }, [cleanup, maxBlobSize, maxDuration, updateAudioLevel]);

  const stopRecording = useCallback(async (): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      if (!mediaRecorderRef.current || !isRecordingRef.current) {
        reject(new Error('No recording in progress'));
        return;
      }

      resolveBlobRef.current = resolve;
      rejectBlobRef.current = reject;

      if (mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    });
  }, []);

  const getSupportedMimeTypeCallback = useCallback((): string => {
    return getSupportedMimeType();
  }, []);

  return {
    state,
    startRecording,
    stopRecording,
    requestPermission,
    getSupportedMimeType: getSupportedMimeTypeCallback,
  };
};
