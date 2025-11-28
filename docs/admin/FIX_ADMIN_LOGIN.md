# 🔐 Исправление входа в админку

## ✅ Что уже исправлено:

1. **Роль admin установлена** для `admin@zizishausen-volleyball.netlify.app`
2. **Edge Functions задеплоены**: chatbot, ingest-content, league-results
3. **Переменные окружения настроены** в netlify.toml

---

## ❌ Текущая проблема: "Invalid login credentials"

### Причина:
Пароль неверный или не установлен для пользователя.

---

## 🔧 Решение:

### Вариант 1: Сбросить пароль через Supabase Dashboard

1. Откройте: https://supabase.com/dashboard/project/kxwmkvtxkaczuonnnxlj/auth/users
2. Найдите пользователя `admin@zizishausen-volleyball.netlify.app`
3. Нажмите **⋮** (три точки) → **Send password reset email**
4. Проверьте почту и установите новый пароль
5. Войдите на сайт с новым паролем

### Вариант 2: Создать нового админа через SQL

```sql
-- Удалить старого админа (если нужно)
DELETE FROM auth.users 
WHERE email = 'admin@zizishausen-volleyball.netlify.app';

-- Создать нового админа
-- ВАЖНО: Замените 'your_secure_password' на ваш пароль!
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@zizishausen-volleyball.netlify.app',
  crypt('your_secure_password', gen_salt('bf')),
  NOW(),
  '{"role": "admin"}'::jsonb,
  NOW(),
  NOW(),
  '',
  ''
);
```

### Вариант 3: Использовать Supabase Auth UI для регистрации

1. Откройте сайт: https://zizishausen-volleyball.netlify.app/admin
2. Если есть кнопка "Sign Up" — зарегистрируйтесь
3. После регистрации выполните SQL:

```sql
-- Установить роль admin для нового пользователя
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email = 'ваш_email@example.com';
```

---

## 🧪 Проверить вход

После установки пароля:

1. Откройте: https://zizishausen-volleyball.netlify.app/admin
2. Введите:
   - Email: `admin@zizishausen-volleyball.netlify.app`
   - Password: ваш новый пароль
3. Нажмите **Login**

**Ожидаемый результат**: Вход успешен, открывается админ-панель.

---

## 🔍 Проверить роль админа

```sql
SELECT 
  id,
  email,
  raw_user_meta_data->>'role' as role,
  email_confirmed_at,
  created_at
FROM auth.users 
WHERE email = 'admin@zizishausen-volleyball.netlify.app';
```

**Должно быть**:
- `role`: `"admin"`
- `email_confirmed_at`: не NULL

---

## ⚠️ Если ошибка 400 Bad Request остается

### Проверьте логи Auth:

```sql
-- Последние попытки входа
SELECT 
  created_at,
  level,
  msg,
  metadata
FROM auth.audit_log_entries
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 10;
```

### Проверьте настройки Auth в Supabase:

1. Откройте: https://supabase.com/dashboard/project/kxwmkvtxkaczuonnnxlj/auth/providers
2. Убедитесь, что **Email** provider включен
3. Проверьте **Site URL**: должен быть `https://zizishausen-volleyball.netlify.app`
4. Проверьте **Redirect URLs**: добавьте `https://zizishausen-volleyball.netlify.app/**`

---

## 📝 Текущий статус

- ✅ Админ роль установлена
- ⚠️ Пароль нужно сбросить/установить
- ✅ Edge Functions работают
- ✅ База данных настроена

---

**Следующий шаг**: Сбросьте пароль через Supabase Dashboard и попробуйте войти снова.

**Дата**: 9 ноября 2025, 14:25
