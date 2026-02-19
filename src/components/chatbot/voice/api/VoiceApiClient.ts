import { supabase } from '@/lib/supabase';
import {
  IVoiceApiClient,
  VoiceTranscribeResponse,
  VoiceTtsResponse,
  VoiceApiError,
  VoiceApiErrorCode,
} from './voiceApi.types';
import { VOICE_CONSTANTS } from '../lib/constants';

const toVoiceApiError = (err: unknown): VoiceApiError => {
  const e = err as Record<string, unknown>;
  const code: VoiceApiErrorCode =
    e?.status === 429
      ? 'rate_limited'
      : e?.status === 401
        ? 'api_key_invalid'
        : e?.status === 400
          ? 'invalid_audio_format'
          : e?.status === 500
            ? 'provider_error'
            : e?.code === 'functions_http_error'
              ? 'provider_error'
              : 'network_error';

  const message = (e?.message as string) ?? 'Voice API request failed';
  const retryAfter =
    (e?.context as Record<string, unknown>)?.retry_after ??
    (e?.retry_after as number);

  return new VoiceApiError(code, message, retryAfter as number | undefined);
};

const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = VOICE_CONSTANTS.RETRY_MAX_ATTEMPTS,
  baseDelay: number = VOICE_CONSTANTS.RETRY_BASE_DELAY
): Promise<T> => {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const voiceError = err as VoiceApiError;

      if (attempt === maxRetries || voiceError?.code !== 'network_error') {
        throw err;
      }

      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error('Max retries exceeded');
};

export class VoiceApiClient implements IVoiceApiClient {
  async transcribeAudio(
    audioBlob: Blob,
    language: string
  ): Promise<VoiceTranscribeResponse> {
    const formData = new FormData();
    formData.append('file', audioBlob);
    formData.append('language', language);

    return retryWithBackoff(async () => {
      const { data, error } = await supabase.functions.invoke(
        'voice-transcribe',
        {
          body: formData,
        }
      );

      if (error) throw toVoiceApiError(error);

      return {
        transcript: data.transcript,
        confidence: data.confidence,
        processingTimeMs: data.processing_time_ms,
      };
    });
  }

  async synthesizeSpeech(
    text: string,
    voiceId: string,
    language: string
  ): Promise<VoiceTtsResponse> {
    return retryWithBackoff(async () => {
      const { data, error } = await supabase.functions.invoke('voice-tts', {
        body: { text, voiceId, language },
      });

      if (error) throw toVoiceApiError(error);

      const audioBlob = new Blob([data], { type: 'audio/mpeg' });
      return { audioBlob };
    });
  }
}

export const voiceApiClient = new VoiceApiClient();
