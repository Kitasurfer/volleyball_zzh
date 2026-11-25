-- Add volleyball rules content for chatbot knowledge base

-- 1. German volleyball rules changes 2025/2026
INSERT INTO public.content_items (
  title,
  slug,
  language,
  type,
  summary,
  tags,
  body_markdown,
  published_at
) VALUES (
  'Regeländerungen zur Saison 2025/2026',
  'regelaenderungen-2025-2026',
  'de',
  'article',
  'Neue Regeln zur Saison 2025/2026: Positionen, Ballüberquerung, Sichtblock',
  ARRAY['regeln', 'volleyball', '2025', 'FIVB'],
  '# Regeländerungen zur Saison 2025/2026

Zur Saison 2025 sind neue Regeln in Kraft getreten.

## 1. Positionen (Regel 7.4)

Die aufschlagende Mannschaft ist von der Einhaltung der vorgegebenen Positionen im Zeitpunkt des Aufschlages befreit.

**Regel 7.4**: Die Spieler der annehmenden Mannschaft müssen im Moment des Aufschlags entsprechend der Rotationsfolge aufgestellt sein. Den Spielern der aufschlagenden Mannschaft steht es jedoch frei, im Moment des Aufschlags eine beliebige Position einzunehmen.

Der richtige Aufschlagspieler muss entsprechend der Rotationsfolge aufschlagen. Es gibt keine Änderung bezüglich eines möglichen Rotationsfehlers.

## 2. Ball überquert das Netz (Regel 10.1)

**Regel 10.1.2**: Nach der ersten Berührung durch die Mannschaft darf ein Ball, der die Netzebene vollständig oder teilweise im Bereich des Außensektors in die Freizone des Gegners durchquert hat, im Rahmen der drei Berührungen zurückgespielt werden.

**Regel 10.1.2.3**: Der Ball, der nach der zweiten oder dritten Berührung der Mannschaft vollständig oder teilweise im Bereich des Außensektors in die Freizone des Gegners gespielt wird, darf nicht zurückgespielt werden und wird als „aus" betrachtet, sobald er die Netzebene durchquert.

Durch diese Änderung sollen unnötige und verletzungsträchtige Spielaktionen vermieden werden.

## 3. Sichtblock (Regel 12.5)

**Regel 12.5.3**: Jedem Spieler der aufschlagenden Mannschaft ist es untersagt, während des Aufschlags seine Hände über den Kopf zu heben, solange der Ball nicht über das Netz geflogen ist.

Der 1. Schiedsrichter darf eine Mannschaft über den Spielkapitän verwarnen, wenn er davon ausgeht, dass diese gezielt die Sicht verdeckt.

### Drei Fälle von Sichtblock-Fehlern:

1. **Hände oberhalb des Kopfes** (12.5.3)
2. **Gruppensichtblock** (12.5.1, 12.5.2)
3. **Individueller Sichtblock** (12.5.1, 12.5.2)

Der 1. Schiedsrichter sollte von Beginn des Spieles an während des Aufschlags auf einen möglichen Sichtblock achten und verhindern, dass die Mannschaften die Sichtblockregel unter dem Vorwand „taktischer Strategie" missbrauchen.

Wenn Spieler einer Mannschaft die Hände über Kopfhöhe halten, soll der 1. Schiedsrichter die aufschlagende Mannschaft vor Bewilligung des Aufschlages durch Pfeifen oder kurzer Ansprache auffordern, die Hände zu senken.

---

## 📄 Offizielle Quellen

- [Offizielle Spielregeln Volleyball](https://shop.volleyball-verband.de/produkt/offizielle-spielregeln-volleyball/)
- [Volleyball-Regeln PDF (Deutsch)](https://www.volleyballer.de/volleyball-regeln-download-deutsch/Volleyball-Regeln.pdf)
- [FIVB Official Rules](https://www.fivb.com/en/volleyball/thegame_glossary/rules)

**Zuletzt bearbeitet**: 01.07.2025',
  NOW()
);

-- 2. Beach volleyball rules (Russian)
INSERT INTO public.content_items (
  title,
  slug,
  language,
  type,
  summary,
  tags,
  body_markdown,
  published_at
) VALUES (
  'Правила пляжного волейбола',
  'pravila-plyazhnogo-voleybola',
  'ru',
  'article',
  'Основные правила пляжного волейбола: размеры площадки, состав команды, система подсчета очков',
  ARRAY['beach volleyball', 'правила', 'пляжный волейбол'],
  '# Правила пляжного волейбола 🏖️

## 📐 Размеры площадки

Площадка для пляжного волейбола имеет размеры **16 метров x 8 метров** (52''6" x 26''3"), что немного меньше, чем площадка для волейбола в зале.

Вокруг площадки имеется свободная зона шириной не менее **5 метров** со всех сторон.

## 👥 Состав команды

- Каждая команда состоит только из **двух игроков**
- Замена игроков не допускается
- Физический контакт между игроками одной команды не допускается

## 🏐 Игра мячом

- Во время розыгрыша игроки могут отбивать мяч от сетки
- Как при подаче, так и при розыгрыше мяч может касаться сетки
- Блок считается первым из трех разрешенных касаний

## 🎯 Система подсчета очков

В пляжном волейболе обычно играют до **трех выигранных сетов**.

---

## 📹 Обучающие видео

### Основы пляжного волейбола
[Смотреть на YouTube](https://www.youtube.com/watch?v=cZFjFK3Pf7c)

### Техника и тактика
[Смотреть на YouTube](https://www.youtube.com/watch?v=2tj8qe9pc38)

---

## 📚 Официальные источники

- [FIVB Official Beach Volleyball Rules](https://www.fivb.com/document-category/official-beach-volleyball-rules/)

Помните, что пляжный волейбол сочетает в себе мастерство, стратегию и командную работу на песчаном берегу. Наслаждайтесь игрой! 🌞🏖️',
  NOW()
);

-- 3. Beach volleyball rules (German)
INSERT INTO public.content_items (
  title,
  slug,
  language,
  type,
  summary,
  tags,
  body_markdown,
  published_at
) VALUES (
  'Beachvolleyball Regeln',
  'beachvolleyball-regeln',
  'de',
  'article',
  'Grundlegende Regeln des Beachvolleyballs: Spielfeldgröße, Teamzusammensetzung, Punktesystem',
  ARRAY['beach volleyball', 'regeln', 'beachvolleyball'],
  '# Beachvolleyball Regeln 🏖️

## 📐 Spielfeldgröße

Das Beachvolleyballfeld hat eine Größe von **16 Meter x 8 Meter** (52''6" x 26''3"), etwas kleiner als ein Hallenvolleyballfeld.

Um das Spielfeld herum gibt es eine Freizone von mindestens **5 Metern** auf allen Seiten.

## 👥 Teamzusammensetzung

- Jedes Team besteht aus nur **zwei Spielern**
- Auswechslungen sind nicht erlaubt
- Körperkontakt zwischen Spielern desselben Teams ist nicht erlaubt

## 🏐 Ballspiel

- Während des Spiels können Spieler den Ball vom Netz abprallen lassen
- Sowohl beim Aufschlag als auch während des Spiels darf der Ball das Netz berühren
- Ein Block zählt als erste von drei erlaubten Berührungen

## 🎯 Punktesystem

Im Beachvolleyball wird normalerweise auf **drei gewonnene Sätze** gespielt.

---

## 📹 Lernvideos

### Grundlagen des Beachvolleyballs
[Auf YouTube ansehen](https://www.youtube.com/watch?v=cZFjFK3Pf7c)

### Technik und Taktik
[Auf YouTube ansehen](https://www.youtube.com/watch?v=2tj8qe9pc38)

---

## 📚 Offizielle Quellen

- [FIVB Official Beach Volleyball Rules](https://www.fivb.com/document-category/official-beach-volleyball-rules/)

Beachvolleyball kombiniert Können, Strategie und Teamarbeit am Sandstrand. Viel Spaß beim Spielen! 🌞🏖️',
  NOW()
);

-- 4. Beach volleyball rules (English)
INSERT INTO public.content_items (
  title,
  slug,
  language,
  type,
  summary,
  tags,
  body_markdown,
  published_at
) VALUES (
  'Beach Volleyball Rules',
  'beach-volleyball-rules',
  'en',
  'article',
  'Basic rules of beach volleyball: court dimensions, team composition, scoring system',
  ARRAY['beach volleyball', 'rules'],
  '# Beach Volleyball Rules 🏖️

## 📐 Court Dimensions

The beach volleyball court measures **16 meters x 8 meters** (52''6" x 26''3"), slightly smaller than an indoor volleyball court.

There is a free zone of at least **5 meters** on all sides around the court.

## 👥 Team Composition

- Each team consists of only **two players**
- Substitutions are not allowed
- Physical contact between players on the same team is not permitted

## 🏐 Ball Play

- During play, players can hit the ball off the net
- The ball may touch the net during both service and play
- A block counts as the first of three allowed touches

## 🎯 Scoring System

Beach volleyball is typically played to **three winning sets**.

---

## 📹 Tutorial Videos

### Beach Volleyball Basics
[Watch on YouTube](https://www.youtube.com/watch?v=cZFjFK3Pf7c)

### Technique and Tactics
[Watch on YouTube](https://www.youtube.com/watch?v=2tj8qe9pc38)

---

## 📚 Official Sources

- [FIVB Official Beach Volleyball Rules](https://www.fivb.com/document-category/official-beach-volleyball-rules/)

Beach volleyball combines skill, strategy, and teamwork on the sandy shore. Enjoy the game! 🌞🏖️',
  NOW()
);
