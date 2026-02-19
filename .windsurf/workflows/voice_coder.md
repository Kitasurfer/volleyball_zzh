# Voice Assistant Coder Workflow

Запускается командой `/voice_coder`

## Роль CODER
Ты - senior frontend разработчик. Твоя задача - реализовать голосового ассистента согласно архитектуре от ARCHITECT, следуя всем стандартам проекта и AGENTS.md правилам.

## Шаг 0: Pre-flight Check

### Если документация не готов - НЕ НАЧИНАТЬ:
- [ ] `docs/ai/voice-assistant/01_architecture.md` существует и полная
- [ ] `docs/ai/voice-assistant/02_api_contracts.md` с четкими форматами
- [ ] `docs/ai/voice-assistant/05_tasks.md` с Definition of Done
- [ ] API контракты реалистичны (проверить MIME types, URL formats)
- [ ] Security архитектура определена (server-side proxy)

### Если что-то не готово - сначала запустить `/voice_architect`

## MVP Scope - Первый вертикальный срез

**Цель:** Минимально рабочий voice recording + TTS с Chatterbox
**Не включать:** Advanced UI, multi-language, settings

**Что реализовать в первом PR:**
1. **Core Infrastructure:**
   - `types/voice.types.ts` - базовые типы для 4 языков
   - `hooks/useAudioRecording.ts` - запись аудио с cleanup
   - `hooks/useSpeechRecognition.ts` - Web Speech API для STT
   - `api/VoiceApiClient.ts` - HTTP клиент для Chatterbox Service

2. **Basic UI:**
   - `ui/VoiceRecorder/VoiceRecorder.tsx` - кнопка записи
   - `ui/VoicePlayer/VoicePlayer.tsx` - воспроизведение TTS
   - `ui/VoiceAssistant/VoiceAssistant.tsx` - контейнер с интеграцией в чат

3. **Backend:**
   - `chatterbox-service/main.py` - FastAPI сервис с Chatterbox
   - `chatterbox-service/requirements.txt` - зависимости
   - `chatterbox-service/Dockerfile` - контейнер

**Что НЕ реализовать в MVP:**
- AudioVisualizer (Phase 2)
- Multi-language UI (Phase 2) - только базовая поддержка
- Settings panel (Phase 2)
- Advanced error handling (Phase 2)

## Шаг 1: Подготовка к реализации

### Изучить документацию:
1. Прочитать `docs/ai/voice-assistant/01_architecture.md`
2. Изучить `docs/ai/voice-assistant/02_api_contracts.md`
3. Проверить `docs/ai/voice-assistant/05_tasks.md` для Definition of Done
4. Следовать `src/components/chatbot/voice/AGENTS.md`

### Проверить зависимости:
```bash
# Frontend не требует дополнительных зависимостей
# Используем нативные Web APIs

# Backend Python зависимости
cd chatterbox-service
pip install -r requirements.txt
```

### Настроить environment:
```bash
# .env.local - только для frontend конфигурации
VITE_VOICE_DEFAULT_LANGUAGE=de
VITE_VOICE_MAX_RECORDING_DURATION=30000
VITE_CHATTERBOX_SERVICE_URL=http://localhost:8000
# НИКАКИХ API КЛЮЧЕЙ - Chatterbox open-source!
```

## Шаг 2: Phase 1 - Core Infrastructure

### Задача 1: Создать базовые типы
**Файл:** `src/components/chatbot/voice/types/voice.types.ts`

**Интерфейсы для реализации:**
```typescript
export interface VoiceConfig {
  language: 'de' | 'en' | 'ru' | 'it';
  pitch: number;
  rate: number;
  voiceId: string;
}

export interface VoiceMessage {
  id: string;
  transcript?: string;
  isProcessing: boolean;
  error?: string;
  timestamp: Date;
}

export interface VoiceState {
  isRecording: boolean;
  isProcessing: boolean;
  currentTranscript: string;
  audioLevel: number;
  permissions: {
    microphone: 'granted' | 'denied' | 'prompt';
  };
}
```

**Чеклист для проверки:**
- [ ] Все интерфейсы соответствуют архитектуре
- [ ] TypeScript strict mode используется
- [ ] Экспорты корректные

### Задача 2: Создать VoiceApiClient
**Файл:** `src/components/chatbot/voice/api/VoiceApiClient.ts`

**Контракт для реализации:**
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

export class VoiceApiClient implements IVoiceApiClient {
  // Реализация через fetch к Chatterbox Service
  // POST http://localhost:8000/tts
}
```

**Требования к реализации:**
- [ ] Использовать fetch для вызова Chatterbox Service
- [ ] Вызывать `POST http://localhost:8000/tts`
- [ ] Timeout 30 секунд для всех запросов
- [ ] Retry логика (2 попытки)
- [ ] Proper error handling с типизацией ошибок
- [ ] Base64 конвертация в Blob
- [ ] Speech-to-Text через Web Speech API (отдельный hook)

### Задача 3: Создать useAudioRecording hook
**Файл:** `src/components/chatbot/voice/hooks/useAudioRecording.ts`

**Контракт для реализации:**
```typescript
export interface UseAudioRecordingReturn {
  state: VoiceState;
  startRecording(): Promise<void>;
  stopRecording(): Promise<Blob>;
  requestPermission(): Promise<'granted' | 'denied' | 'prompt' | 'unsupported'>;
  getSupportedMimeType(): string;
}

export const useAudioRecording = (options?: {
  maxDuration?: number; // ms, default 30000
  maxBlobSize?: number; // bytes, default 5MB
  mimeType?: string;
}): UseAudioRecordingReturn => {
  // Реализация с MediaRecorder API
  // Proper cleanup stream tracks
  // Permission handling with fallback
  // Audio level monitoring
  // Auto-stop by maxDuration
  // Size validation during recording
};
```

### Задача 4: Создать useSpeechRecognition hook
**Файл:** `src/components/chatbot/voice/hooks/useSpeechRecognition.ts`

**Контракт для реализации:**
```typescript
export interface UseSpeechRecognitionReturn {
  isListening: boolean;
  transcript: string;
  error: string | null;
  startListening(): void;
  stopListening(): void;
}

export const useSpeechRecognition = (language: 'de' | 'en' | 'ru' | 'it') => {
  // Реализация с Web Speech API
  // Language switching (de-DE, en-US, ru-RU, it-IT)
  // Error handling (not-allowed, no-speech, network)
  // Fallback detection если API не поддерживается
};
```

**Definition of Done - критичные требования:**
- [ ] `stopRecording(): Promise<Blob>` - не callback!
- [ ] **Обязательно** `stream.getTracks().forEach(track => track.stop())`
- [ ] **MIME type negotiation** через `MediaRecorder.isTypeSupported()`
- [ ] **Auto-stop** по maxDuration (default 30 секунд)
- [ ] **Size validation** - auto-stop если blob > maxBlobSize (default 5MB)
- [ ] **Single active recording** - защита от двойного старта
- [ ] **AudioContext cleanup**: `audioContext.close()`, `analyser.disconnect()`
- [ ] **Animation cleanup**: `cancelAnimationFrame()`
- [ ] Permission state handling (granted/denied/prompt/unsupported)
- [ ] Error boundaries для recording failures
- [ ] Memory leak prevention

**MIME Type Detection (обязательно):**
```typescript
export const getSupportedMimeType = (): string => {
  const types = [
    'audio/webm;codecs=opus',
    'audio/wav', 
    'audio/mpeg'
  ];
  
  const supported = types.find(type => MediaRecorder.isTypeSupported(type));
  if (!supported) {
    throw new Error('Browser does not support audio recording');
  }
  
  return supported;
};
```

**Auto-stop implementation (обязательно):**
```typescript
const startRecording = async () => {
  // ... setup MediaRecorder
  
  // Auto-stop timer
  const stopTimer = setTimeout(() => {
    if (mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    }
  }, maxDuration);
  
  mediaRecorder.onstop = () => {
    clearTimeout(stopTimer);
    // cleanup logic
  };
};
```

## Шаг 3: Phase 2 - UI Components

### Задача 4: Создать VoiceRecorder компонент
**Файл:** `src/components/chatbot/voice/ui/VoiceRecorder/VoiceRecorder.tsx`

**Props интерфейс:**
```typescript
interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  disabled?: boolean;
  maxDuration?: number; // ms
}
```

**Чеклист реализации:**
- [ ] Кнопка record/stop с правильными состояниями
- [ ] Accessibility: ARIA labels, keyboard navigation
- [ ] Интеграция с useAudioRecording hook
- [ ] Error boundaries для recording failures
- [ ] Loading states и error messages
- [ ] AudioVisualizer компонент интегрирован

### Задача 5: Создать AudioVisualizer компонент
**Файл:** `src/components/chatbot/voice/ui/VoiceRecorder/AudioVisualizer.tsx`

**Props интерфейс:**
```typescript
interface AudioVisualizerProps {
  audioLevel: number;
  isRecording: boolean;
}
```

**Требования:**
- [ ] Canvas-based visualization
- [ ] requestAnimationFrame для smooth animation
- [ ] Respect prefers-reduced-motion
- [ ] Color contrast sufficient

### Задача 6: Создать VoicePlayer компонент
**Файл:** `src/components/chatbot/voice/ui/VoicePlayer/VoicePlayer.tsx`

**Props интерфейс:**
```typescript
interface VoicePlayerProps {
  audioBlob: Blob;
  autoPlay?: boolean;
  onError?: (error: Error) => void;
  onEnded?: () => void;
}
```

**Definition of Done - критичные требования:**
- [ ] **URL.createObjectURL()** для audio blob
- [ ] **Обязательно URL.revokeObjectURL()** при unmount/смена blob
- [ ] **Autoplay restrictions handling** (особенно iOS/Safari)
- [ ] HTML5 Audio API для воспроизведения
- [ ] Controls: play/pause/stop/volume
- [ ] Fallback на Web Speech API если blob недоступен
- [ ] Proper cleanup audio sources
- [ ] Error handling для unsupported formats
- [ ] Accessibility controls (keyboard navigation)

**Must-have behaviors (не копировать код):**
- Create object URL when blob changes
- Try autoplay if requested → catch blocked → show play button
- Revoke URL on cleanup (critical)
- Handle iOS autoplay restrictions
- Fallback to Web Speech API on blob errors
- Proper audio source cleanup on unmount

## Шаг 4: Phase 3 - Integration

### Задача 7: Создать VoiceAssistant главный компонент
**Файл:** `src/components/chatbot/voice/ui/VoiceAssistant/VoiceAssistant.tsx`

**Props интерфейс:**
```typescript
interface VoiceAssistantProps {
  config: VoiceConfig;
  onMessage: (text: string) => void;
}
```

**Чеклист реализации:**
- [ ] Интеграция с существующим чатботом
- [ ] State management для recording/processing
- [ ] Error handling и retry логика
- [ ] VoiceRecorder и VoicePlayer интегрированы
- [ ] Localization для сообщений об ошибках

### Задача 8: Интеграция с чатботом
**Файлы:** Обновить существующие чатбот компоненты

**Точки интеграции:**
- [ ] Добавить VoiceAssistant в Chatbot компонент
- [ ] Обновить index.ts экспорты
- [ ] Интегрироваться с LanguageContext
- [ ] Обновить типы сообщений для voice

## Шаг 5: Phase 4 - Backend Chatterbox Service

### Задача 9: Создать Chatterbox Service
**Файл:** `chatterbox-service/main.py`

**Контракт:**
```python
# POST /tts
# Request: { text, language, voice_id }
# Response: { audio_data: base64, sample_rate: int, success: bool, message: str }
```

**Требования:**
- [ ] FastAPI сервер на порту 8000
- [ ] ChatterboxMultilingualTTS для 4 языков
- [ ] Base64 кодирование аудио
- [ ] Health check endpoint /health
- [ ] Error handling для model not loaded, unsupported languages
- [ ] CORS настройки для frontend

### Задача 10: Создать Docker контейнер
**Файл:** `chatterbox-service/Dockerfile`

**Требования:**
- [ ] Python 3.11 base image
- [ ] Установка зависимостей из requirements.txt
- [ ] Port 8000 exposure
- [ ] GPU support если доступно (CUDA)
- [ ] Health check

### Задача 11: Создать requirements.txt
**Файл:** `chatterbox-service/requirements.txt`

**Требования:**
- [ ] torch>=2.0.0
- [ ] torchaudio>=2.0.0
- [ ] chatterbox-tts
- [ ] fastapi==0.104.1
- [ ] uvicorn==0.24.0
- [ ] python-multipart==0.0.6

## Шаг 6: Phase 5 - Testing

### Задача 12: Unit тесты
**Файлы:** `src/components/chatbot/voice/__tests__/`

**Чеклист тестов:**
- [ ] useAudioRecording hook тесты с моками
- [ ] useSpeechRecognition hook тесты с моками
- [ ] VoiceApiClient тесты с моками fetch
- [ ] Component rendering тесты
- [ ] Error handling сценарии

### Задача 13: Integration тесты
**Чеклист:**
- [ ] Voice flow end-to-end с моками Chatterbox Service
- [ ] Permission handling тесты
- [ ] Browser compatibility тесты
- [ ] Chatterbox Service health check тесты

## Шаг 7: Финализация

### Задача 14: Создать index файлы
**Файл:** `src/components/chatbot/voice/index.ts`

**Экспорты:**
```typescript
export { VoiceAssistant } from './ui/VoiceAssistant';
export { VoiceRecorder } from './ui/VoiceRecorder';
export { VoicePlayer } from './ui/VoicePlayer';
export { useAudioRecording } from './hooks/useAudioRecording';
export { useSpeechRecognition } from './hooks/useSpeechRecognition';
export { VoiceApiClient } from './api/VoiceApiClient';
export type { VoiceConfig, VoiceMessage, VoiceState } from './types/voice.types';
```

### Задача 15: Обновить package.json
```json
{
  "dependencies": {
    // Никаких дополнительных зависимостей для frontend
    // Используем нативные Web APIs
  }
}
```

## Финальная проверка перед завершением

### Code Quality:
- [ ] Все компоненты следуют AGENTS.md правилам
- [ ] TypeScript строгий режим включен
- [ ] Error handling реализован везде
- [ ] Accessibility атрибуты добавлены
- [ ] Performance оптимизации (cleanup, memo)

### Integration:
- [ ] Интеграция с чатботом работает
- [ ] Language context интегрирован
- [ ] State synchronization правильная
- [ ] Error propagation в chat context

### Testing:
- [ ] Unit тесты проходят
- [ ] Integration тесты покрывают основные сценарии
- [ ] Manual testing checklist выполнен

### Documentation:
- [ ] README обновлен с setup инструкциями
- [ ] API documentation актуальна
- [ ] Troubleshooting guide полный

## Результат выполнения

CODER должен создать полностью рабочий голосовой ассистент:
1. **Frontend компоненты** с правильной архитектурой
2. **Backend Chatterbox Service** с open-source TTS  
3. **Полная интеграция** с существующим чатботом
4. **Базовые тесты** и документация
5. **Security compliance** - никаких API ключей, полностью бесплатное решение

**Важно:** Не копировать код из этого workflow! Использовать только контракты и чеклисты для самостоятельной реализации с учетом стека проекта.

**Запуск Chatterbox Service:**
```bash
cd chatterbox-service
pip install -r requirements.txt
python main.py
# Сервис доступен на http://localhost:8000
```
