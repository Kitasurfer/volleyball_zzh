-- Migration to add referee gestures content and link media for the chatbot
-- This will provide data for "smart" answers with images

-- 1. Create the content item for Referee Gestures (Russian)
INSERT INTO public.content_items (
  id,
  title,
  slug,
  language,
  status,
  type,
  summary,
  tags,
  body_markdown,
  published_at
) VALUES (
  'a1b2c3d4-e5f6-4a5b-bc6d-7e8f9a0b1c2d',
  'Жесты судей в волейболе',
  'referee-gestures-v1',
  'ru',
  'published',
  'article',
  'Подробное описание официальных жестов судей FIVB с визуальными пояснениями.',
  ARRAY['судейство', 'жесты', 'правила'],
  '# Жесты судей в волейболе 🏐

Официальные жесты судей используются для информирования игроков, тренеров и зрителей о принятых решениях.

## Основные жесты:

### 1. Аут (Out)
**Жест**: Поднять руки вертикально, ладони обращены к туловищу.
**Когда используется**: Когда мяч касается пола за пределами площадки или касается предмета вне игры.

### 2. Мяч в поле (Ball In)
**Жест**: Указать рукой с вытянутыми пальцами на пол в направлении соответствующей стороны площадки.

### 3. Удаление игрока
**Жест**: Показать желтую и красную карточки вместе (в одной руке) для удаления или раздельно для дисквалификации.

### 4. Заслон (Screening)
**Жест**: Поднять обе руки вертикально, ладони обращены вперед.',
  NOW()
);

-- 2. Add some dummy media assets for these gestures if they don't exist
-- In a real scenario, these would be actual uploaded files in storage
INSERT INTO public.media_assets (
  id,
  storage_path,
  title,
  description,
  media_type,
  metadata
) VALUES 
(
  'f1e2d3c4-b5a6-4987-9876-54321abcdef1',
  'referee/out_gesture.jpg',
  'Жест судьи: Аут',
  'Руки подняты вертикально, ладони обращены внутрь.',
  'image',
  '{"classification": "referee_gesture", "gesture_type": "out"}'::jsonb
),
(
  'f1e2d3c4-b5a6-4987-9876-54321abcdef2',
  'referee/ball_in_gesture.jpg',
  'Жест судьи: Мяч в поле',
  'Рука указывает на пол внутри площадки.',
  'image',
  '{"classification": "referee_gesture", "gesture_type": "in"}'::jsonb
),
(
  'f1e2d3c4-b5a6-4987-9876-54321abcdef3',
  'referee/expulsion_gesture.jpg',
  'Жест судьи: Удаление',
  'Судья показывает желтую и красную карточки вместе.',
  'image',
  '{"classification": "referee_gesture", "gesture_type": "expulsion"}'::jsonb
)
ON CONFLICT (storage_path) DO NOTHING;

-- 3. Link media to the content item
INSERT INTO public.content_media_links (
  content_id,
  media_id,
  role,
  position
) VALUES 
(
  'a1b2c3d4-e5f6-4a5b-bc6d-7e8f9a0b1c2d',
  (SELECT id FROM public.media_assets WHERE storage_path = 'referee/out_gesture.jpg'),
  'inline',
  1
),
(
  'a1b2c3d4-e5f6-4a5b-bc6d-7e8f9a0b1c2d',
  (SELECT id FROM public.media_assets WHERE storage_path = 'referee/ball_in_gesture.jpg'),
  'inline',
  2
),
(
  'a1b2c3d4-e5f6-4a5b-bc6d-7e8f9a0b1c2d',
  (SELECT id FROM public.media_assets WHERE storage_path = 'referee/expulsion_gesture.jpg'),
  'inline',
  3
)
ON CONFLICT DO NOTHING;

-- 4. Enqueue vector job for this new content
INSERT INTO public.vector_jobs (
  content_id,
  status
) VALUES (
  'a1b2c3d4-e5f6-4a5b-bc6d-7e8f9a0b1c2d',
  'pending'
);
