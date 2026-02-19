# Voice Assistant Agent Instructions

## Scope
This AGENTS.md applies to all files in `src/components/chatbot/voice/` and subdirectories.

## Architecture Principles

### Component Structure
```
src/components/chatbot/voice/
├── ui/
│   ├── VoiceAssistant/
│   │   ├── index.tsx
│   │   └── VoiceAssistant.tsx
│   ├── VoiceRecorder/
│   │   ├── index.tsx
│   │   ├── VoiceRecorder.tsx
│   │   └── AudioVisualizer.tsx
│   └── VoicePlayer/
│       ├── index.tsx
│       ├── VoicePlayer.tsx
│       └── AudioControls.tsx
├── hooks/
│   ├── useAudioRecording.ts
│   ├── useSpeechRecognition.ts
│   └── useTextToSpeech.ts
├── api/
│   ├── VoiceApiClient.ts
│   └── voiceApi.types.ts
├── types/
│   └── voice.types.ts
├── lib/
│   ├── constants.ts
│   └── utils.ts
└── index.ts
```

### File Naming
- Use PascalCase for components: `VoiceAssistant.tsx`
- Use camelCase for hooks: `useAudioRecording.ts`
- Use kebab-case for utilities: `voice-utils.ts`

### Dependencies
- Primary: **Chatterbox Service** (Python FastAPI) for TTS
- Secondary: Web Speech API for STT
- Audio recording: MediaRecorder API
- State management: React Context or Zustand
- **NO PAID APIs** - полностью бесплатное решение

## Implementation Rules

### Voice Recording
```typescript
// ✅ Correct pattern
const startRecording = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // recording logic
  } catch (error) {
    handleRecordingError(error);
  }
};

// ✅ Proper cleanup pattern
const stopRecording = async (): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    mediaRecorder.onstop = () => {
      stream.getTracks().forEach(track => track.stop());
      const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
      resolve(audioBlob);
    };
    mediaRecorder.stop();
  });
};
```

### Voice API Integration
```typescript
// ✅ Required pattern - local Chatterbox Service
import { VoiceApiClient } from '../api/VoiceApiClient';

const voiceClient = new VoiceApiClient();
const audio = await voiceClient.synthesizeSpeech('Hello', 'de');

// ❌ НЕПРАВИЛЬНО: API ключи на фронтенде
// import { Chatterbox } from '@resembleai/chatterbox';
```

### Speech Recognition
```typescript
// ✅ Correct pattern - Web Speech API
const useSpeechRecognition = (language: 'de' | 'en' | 'ru' | 'it') => {
  const recognition = new webkitSpeechRecognition();
  recognition.lang = `${language}-${language.toUpperCase()}`;
  // browser native implementation
};

// ❌ НЕПРАВИЛЬНО: External STT services
// Use only Web Speech API for speech-to-text
```

### Error Handling
- Always handle microphone permissions
- Provide fallback for unsupported browsers
- Show clear error messages in 4 languages (de, en, ru, it)
- Log errors for debugging

### Performance
- Stop recording when not active
- Use Web Workers for audio processing if needed
- Implement proper cleanup in useEffect
- Use requestAnimationFrame for smooth animations

### Audio Context Cleanup (CRITICAL)
```typescript
// ✅ Proper cleanup for audio level monitoring
const cleanupAudioContext = () => {
  if (audioContext) {
    analyser.disconnect();
    audioContext.close();
    audioContext = null;
  }
  
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
};

// ✅ Always cleanup on stopRecording and unmount
useEffect(() => {
  return cleanupAudioContext; // Critical for memory leak prevention
}, []);
```

## Security & Privacy
- Never store audio recordings without consent
- **NO API KEYS** - Chatterbox is open-source
- Implement audio data encryption if storing
- Follow GDPR for voice data
- Use local Chatterbox Service for processing

## Testing Requirements
- Unit tests for all hooks
- Integration tests for VoiceApiClient
- E2E tests for voice flow
- Mock audio recording in tests
- Test permission handling scenarios

## Documentation
- Update docs/ai/voice-assistant/ with API contracts
- Document voice configuration options
- Include browser compatibility matrix
- Add troubleshooting guide

## Fallback Strategy
- Web Speech API для STT если не поддерживается
- Graceful degradation если microphone permission denied
- Text-only input как ultimate fallback
- Browser compatibility checks

## Do NOT
- ❌ Mix voice logic with UI components
- ❌ Use any paid APIs or API keys
- ❌ Ignore browser permissions
- ❌ Create monolithic voice components
- ❌ Skip error boundaries
- ❌ Store audio blobs without necessity

## Always DO
- ✅ Create separate hooks for voice logic
- ✅ Use TypeScript strict mode
- ✅ Implement loading states
- ✅ Add accessibility features
- ✅ Test with different audio devices
- ✅ Proper cleanup stream tracks
- ✅ Use local Chatterbox Service (FREE)
- ✅ Support 4 languages (de, en, ru, it)
