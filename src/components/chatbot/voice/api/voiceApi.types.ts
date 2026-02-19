export interface IVoiceApiClient {
  transcribeAudio(
    audioBlob: Blob,
    language: string
  ): Promise<VoiceTranscribeResponse>;

  synthesizeSpeech(
    text: string,
    voiceId: string,
    language: string
  ): Promise<VoiceTtsResponse>;
}

export interface VoiceTranscribeResponse {
  transcript: string;
  confidence: number;
  processingTimeMs: number;
}

export interface VoiceTtsResponse {
  audioBlob: Blob;
}

export type VoiceApiErrorCode =
  | 'invalid_audio_format'
  | 'api_key_invalid'
  | 'rate_limited'
  | 'provider_error'
  | 'network_error';

export class VoiceApiError extends Error {
  constructor(
    public code: VoiceApiErrorCode,
    message: string,
    public retryAfter?: number
  ) {
    super(message);
    this.name = 'VoiceApiError';
  }
}
