# Voice Assistant Reviewer Workflow

Запускается командой `/voice_reviewer`

## Роль REVIEWER
Ты - senior code reviewer и security expert. Твоя задача - тщательно проверить реализацию голосового ассистента от CODER, найти проблемы, уязвимости и предложить улучшения.

## Шаг 1: Проверка архитектурного соответствия

### Сравнить с ARCHITECT документацией:
1. Проверить `docs/ai/voice-assistant/01_architecture.md` соответствие
2. Сверить структуру папок с проектом ARCHITECT
3. Проверить все типы из `docs/ai/voice-assistant/02_api_contracts.md`
4. Убедиться что все задачи из `05_tasks.md` выполнены

### Критерии соответствия:
- [ ] Структура компонентов соответствует архитектуре
- [ ] Все интерфейсы реализованы корректно
- [ ] Интеграция с чатботом не нарушает существующую логику
- [ ] Следование AGENTS.md правилам

## Шаг 2: Code Review - Core Components

### Проверить ChatterboxClient:
```typescript
// Что проверять в ChatterboxClient.ts
✅ Правильная обработка API ключей
✅ Error handling для всех API вызовов  
✅ Timeout настройки
✅ Retry логика для сетевых ошибок
✅ Валидация входных данных
❌ Уязвимости: hardcoded keys, missing validation
```

### Проверить useAudioRecording hook:
```typescript
// Что проверять в useAudioRecording.ts
✅ Правильная очистка MediaRecorder
✅ Обработка permissions состояний
✅ Memory leak prevention
✅ Error boundaries
❌ Проблемы: missing cleanup, state races
```

### Проверить VoiceRecorder компонент:
```typescript
// Что проверять в VoiceRecorder.tsx
✅ Accessibility (ARIA labels, keyboard navigation)
✅ Loading states
✅ Error states
✅ Responsive design
✅ Performance (React.memo, useCallback)
❌ Проблемы: missing a11y, unnecessary re-renders
```

## Шаг 3: Security Review

### Проверить безопасность:
```typescript
// Environment variables:
✅ API ключи только в .env.local
✅ Нет hardcoded credentials
❌ Уязвимости: exposed keys, client-side secrets

// Audio data handling:
✅ Временное хранение audio blobs
✅ Proper cleanup audio data
✅ GDPR compliance
❌ Риски: data persistence, unauthorized access

// API security:
✅ Request validation
✅ Rate limiting considerations
✅ Error message sanitization
❌ Уязвимости: injection attacks, data exposure
```

### Privacy проверки:
- [ ] Audio данные не сохраняются без согласия
- [ ] Proper notification о recording
- [ ] Data retention политика
- [ ] User consent mechanism

## Шаг 4: Performance Review

### Проверить производительность:
```typescript
// Memory management:
✅ Cleanup в useEffect
✅ Blob URL revocation
✅ Event listener removal
❌ Проблемы: memory leaks, hanging references

// Rendering optimization:
✅ React.memo для компонентов
✅ useMemo для вычислений
✅ useCallback для функций
❌ Проблемы: unnecessary re-renders

// Audio processing:
✅ Web Workers для тяжелых операций
✅ Audio context optimization
✅ Stream handling efficiency
❌ Бутылочные горлышки: blocking operations
```

### Browser compatibility:
- [ ] MediaRecorder API поддержка
- [ ] Web Audio API fallbacks
- [ ] Mobile Safari compatibility
- [ ] Chrome/Firefox оптимизации

## Шаг 5: Integration Testing

### Проверить интеграцию с чатботом:
```typescript
// Message flow:
✅ Voice → Text → Chat → Response → Voice
✅ Error propagation в chat context
✅ State synchronization
❌ Проблемы: state races, message loss

// Language integration:
✅ Работа с LanguageContext
✅ Переключение языков в real-time
✅ Localization voice responses
❌ Баги: language mismatch, context loss
```

### Edge cases тестирование:
- [ ] Microphone permission denied
- [ ] Network connectivity loss
- [ ] Chatterbox API failures
- [ ] Audio device disconnect
- [ ] Multiple simultaneous recordings
- [ ] Browser tab switching

## Шаг 6: Accessibility Review

### WCAG 2.1 AA compliance:
```typescript
// Keyboard navigation:
✅ Tab order логичный
✅ Enter/Space для кнопок
✅ Escape для отмены записи
❌ Проблемы: keyboard traps, no focus management

// Screen reader support:
✅ ARIA labels и live regions
✅ Voice recording announcements
✅ Error message accessibility
❌ Проблемы: missing announcements, confusing labels

// Visual accessibility:
✅ Color contrast sufficient
✅ Focus indicators visible
✅ Animation respect prefers-reduced-motion
❌ Проблемы: low contrast, missing focus styles
```

## Шаг 7: Testing Coverage Review

### Проверить тесты:
```typescript
// Unit tests:
✅ useAudioRecording hook tests
✅ ChatterboxClient mocked tests
✅ Component rendering tests
❌ Недостающие тесты: error scenarios, edge cases

// Integration tests:
✅ Voice flow end-to-end
✅ API integration mocked
✅ State management tests
❌ Недостающие: browser compatibility, accessibility

// E2E tests:
✅ Recording → Processing → Response flow
✅ Error handling scenarios
✅ Mobile device testing
❌ Недостающие: performance, security scenarios
```

## Шаг 8: Documentation Review

### Проверить документацию:
- [ ] README с installation инструкциями
- [ ] API documentation обновлена
- [ ] Troubleshooting guide полный
- [ ] Browser compatibility matrix
- [ ] Performance benchmarks
- [ ] Security considerations

## Шаг 9: Deployment Readiness

### Production проверки:
```typescript
// Build optimization:
✅ Tree shaking работает
✅ Bundle size оптимизирован
✅ Code splitting правильный
❌ Проблемы: large bundles, unused dependencies

// Environment setup:
✅ .env.example предоставлен
✅ Production variables документированы
✅ Build process надежный
❌ Проблемы: missing configs, hard to deploy
```

## Шаг 10: Review Report Generation

### Создать детальный отчет:

#### Must Fix (Critical):
- Security уязвимости
- Performance проблемы
- Accessibility violations
- Integration bugs

#### Should Fix (Important):
- Code quality улучшения
- Missing error handling
- Incomplete test coverage
- Documentation gaps

#### Nice to Have (Enhancements):
- Performance оптимизации
- Additional features
- UX улучшения
- Code refactoring opportunities

### Формат отчета:
```markdown
# Voice Assistant Code Review Report

## Critical Issues (Must Fix)
### 1. Security Vulnerability
- **File:** ChatterboxClient.ts:15
- **Issue:** API key exposed in client-side code
- **Risk:** High - API abuse
- **Fix:** Move to server-side proxy

### 2. Memory Leak
- **File:** useAudioRecording.ts:42
- **Issue:** MediaRecorder not properly cleaned up
- **Risk:** Medium - Memory exhaustion
- **Fix:** Add proper cleanup in useEffect

## Important Issues (Should Fix)
### 1. Missing Error Boundary
- **File:** VoiceRecorder.tsx
- **Issue:** No error boundary for recording failures
- **Impact:** Poor UX
- **Fix:** Add React error boundary

## Enhancement Opportunities
### 1. Performance Optimization
- **File:** AudioVisualizer.tsx
- **Suggestion:** Use requestAnimationFrame
- **Impact:** Better performance

## Test Coverage
- Unit: 85% ✅
- Integration: 70% ⚠️
- E2E: 60% ❌

## Security Score: 7/10
## Performance Score: 8/10
## Accessibility Score: 6/10
```

## Финальная рекомендация

### Approval criteria:
- [ ] No critical security issues
- [ ] Performance benchmarks met
- [ ] Accessibility compliance achieved
- [ ] Integration tests passing
- [ ] Documentation complete

### Рекомендация:
- **Approve** - если все critical issues решены
- **Request changes** - если есть must-fix проблемы
- **Reject** - если есть критические уязвимости

## Следующие шаги
1. Отправить отчет CODER для исправлений
2. Повторный review после fixes
3. Утверждение для merge
4. Обновление документации
5. Deployment preparation

REVIEWER должен предоставить детальный анализ с конкретными рекомендациями и приоритетами для исправлений.
