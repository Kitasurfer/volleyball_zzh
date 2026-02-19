# Voice Assistant API Contracts

## Backend API Endpoints (Chatterbox Service + Web Speech API)

### 1. Text-to-Speech (Chatterbox Service)
**Endpoint:** `POST http://localhost:8000/tts`

**Request Format:** `application/json`
```json
{
  "text": "Text to synthesize",
  "language": "de" | "en" | "ru" | "it",
  "voice_id": "default"
}
```

**Response Format:** `application/json`
```json
{
  "audio_data": "base64_encoded_audio_data",
  "sample_rate": 24000,
  "success": true,
  "message": "Speech generated successfully"
}
```

**Error Responses:**
```json
// 503 Service Unavailable
{
  "detail": "Chatterbox model not loaded"
}

// 400 Bad Request
{
  "detail": "Unsupported language: fr. Supported: ['de', 'en', 'ru', 'it']"
}

// 500 Internal Server Error
{
  "detail": "Speech generation failed: CUDA out of memory"
}
```

### 2. Speech-to-Text (Web Speech API)
**Implementation:** Browser Native API

**Request Format:** Audio Blob from MediaRecorder
```typescript
const recognition = new webkitSpeechRecognition();
recognition.lang = 'de-DE'; // 'en-US', 'ru-RU', 'it-IT'
recognition.onresult = (event) => {
  const transcript = event.results[0][0].transcript;
  const confidence = event.results[0][0].confidence;
};
```

**Response Format:** Browser Event
```typescript
interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResult {
  [index: number]: {
    transcript: string;
    confidence: number;
  };
  isFinal: boolean;
  length: number;
}
```

**Error Responses:**
```typescript
// Browser Error Events
recognition.onerror = (event) => {
  switch (event.error) {
    case 'not-allowed':
      // Microphone permission denied
      break;
    case 'no-speech':
      // No speech detected
      break;
    case 'network':
      // Network error
      break;
    case 'service-not-allowed':
      // Service not allowed
      break;
  }
};
```

## Frontend API Client Contracts

### VoiceApiClient Interface
```typescript
export interface IVoiceApiClient {
  synthesizeSpeech(
    text: string, 
    language: 'de' | 'en' | 'ru' | 'it',
    voiceId?: string
  ): Promise<VoiceTtsResponse>;
}

export interface VoiceTtsResponse {
  audioBlob: Blob;
  sampleRate: number;
  success: boolean;
  message: string;
}

export class VoiceApiError extends Error {
  constructor(
    public code: 'model_not_loaded' | 'unsupported_language' | 'text_too_long' | 'generation_failed' | 'network_error',
    message: string,
    public retryAfter?: number // seconds
  ) {
    super(message);
    this.name = 'VoiceApiError';
  }
}

// Web Speech API Types
export interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

export interface SpeechRecognitionError {
  error: 'not-allowed' | 'no-speech' | 'network' | 'service-not-allowed';
  message?: string;
}
```

### Implementation Requirements
```typescript
// Chatterbox Service Client
const synthesizeSpeech = async (
  text: string, 
  language: 'de' | 'en' | 'ru' | 'it',
  voiceId: string = 'default'
): Promise<VoiceTtsResponse> => {
  const response = await fetch('http://localhost:8000/tts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      language,
      voice_id: voiceId,
    }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw mapHttpErrorToVoiceError(response.status, body);
  }

  const data = await response.json();
  
  // Конвертация base64 в Blob
  const audioBytes = Uint8Array.from(atob(data.audio_data), c => c.charCodeAt(0));
  const audioBlob = new Blob([audioBytes], { type: 'audio/wav' });

  return {
    audioBlob,
    sampleRate: data.sample_rate,
    success: data.success,
    message: data.message,
  };
};

// Error mapper for Chatterbox Service
const mapHttpErrorToVoiceError = (status: number, body: any): VoiceApiError => {
  switch (status) {
    case 400:
      return new VoiceApiError('unsupported_language', body?.detail ?? 'Unsupported language');
    case 503:
      return new VoiceApiError('model_not_loaded', body?.detail ?? 'Chatterbox model not loaded');
    case 500:
      return new VoiceApiError('generation_failed', body?.detail ?? 'Speech generation failed');
    default:
      return new VoiceApiError('network_error', 'Network connection failed');
  }
};

// Web Speech API Hook
const useSpeechRecognition = (language: 'de' | 'en' | 'ru' | 'it') => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const startListening = useCallback(() => {
    if (!('webkitSpeechRecognition' in window)) {
      setError('Speech recognition not supported');
      return;
    }

    const recognition = new webkitSpeechRecognition();
    recognition.lang = `${language}-${language.toUpperCase()}`;
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event) => {
      const result = event.results[0][0];
      setTranscript(result.transcript);
    };
    recognition.onerror = (event) => {
      setError(`Speech recognition error: ${event.error}`);
      setIsListening(false);
    };

    recognition.start();
  }, [language]);

  return { isListening, transcript, error, startListening };
};

## Error Handling Strategy

### Retry Strategy (TypeScript-safe)
```typescript
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 2,
  baseDelay: number = 1000
): Promise<T> => {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      // TypeScript-safe проверка типа
      const voiceError = err as VoiceApiError;
      
      if (attempt === maxRetries || voiceError?.code !== 'network_error') {
        throw err;
      }
      
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error('Max retries exceeded');
};
```

### Rate Limiting
```typescript
export class RateLimiter {
  private lastCall = 0;
  private minInterval = 1000; // 1 second between calls
  
  async waitForSlot(): Promise<void> {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastCall;
    
    if (timeSinceLastCall < this.minInterval) {
      await new Promise(resolve => 
        setTimeout(resolve, this.minInterval - timeSinceLastCall)
      );
    }
    
    this.lastCall = Date.now();
  }
}
```

## Security Headers & CORS

### Required Headers (Edge Functions)
```typescript
// voice-transcribe/index.ts
Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    const origin = req.headers.get('Origin');
    const allowedOrigins = [
      'http://localhost:5173',     // dev
      'https://your-domain.com',    // prod
    ];
    
    const isAllowed = allowedOrigins.includes(origin) || !origin; // allow server-side
    
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': isAllowed ? (origin || '*') : 'null',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey',
        'Access-Control-Max-Age': '86400',
        'Vary': 'Origin' // Important for caching
      }
    });
  }
  
  // Process request...
  const origin = req.headers.get('Origin');
  const allowedOrigins = ['http://localhost:5173', 'https://your-domain.com'];
  const isAllowed = allowedOrigins.includes(origin) || !origin;
  
  return new Response(JSON.stringify(response), {
    headers: {
      'Access-Control-Allow-Origin': isAllowed ? (origin || '*') : 'null',
      'Content-Type': 'application/json',
      'Vary': 'Origin'
    }
  });
});
```

### Production Security Notes:
- **Dev environment:** Можно использовать `*` для удобства
- **Production:** Указать конкретные домены
- **Credentials:** Если нужны cookies/authorization - добавить `Access-Control-Allow-Credentials: true`
- **Vary header:** Важно для правильного кеширования CDN

## Testing Contracts

### Mock Response Format
```typescript
export const mockTranscribeResponse: VoiceTranscribeResponse = {
  transcript: "Hello world",
  confidence: 0.95,
  processingTimeMs: 1200
};

export const mockTtsResponse: VoiceTtsResponse = {
  audioBlob: new Blob([mockAudioData], { type: 'audio/mpeg' })
  // duration будет получен через audioElement.duration после загрузки
};
```

### Error Scenarios for Testing
```typescript
export const testErrorScenarios = [
  { status: 400, error: { code: 'invalid_audio_format', message: '...' } },
  { status: 401, error: { code: 'api_key_invalid', message: '...' } },
  { status: 429, error: { code: 'rate_limited', message: '...', retry_after: 60 } },
  { status: 500, error: { code: 'provider_error', message: '...' } }
];
```
