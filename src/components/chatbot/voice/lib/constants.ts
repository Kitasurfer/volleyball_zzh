export const VOICE_CONSTANTS = {
  MAX_RECORDING_DURATION: 60_000, // 60s safety cap
  MAX_BLOB_SIZE: 5 * 1024 * 1024, // 5 MB
  RETRY_MAX_ATTEMPTS: 3,
  RETRY_BASE_DELAY: 500,
} as const;

export const SUPPORTED_MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/ogg;codecs=opus',
  'audio/webm',
  'audio/ogg',
];
