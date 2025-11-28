---
title: Volleyball Substitution Rules (Multilingual)
description: Canonical snippets describing the "six substitutions per set" limitation for indoor volleyball. These texts are used for manual chunk uploads to Qdrant.
last_updated: 2025-11-25
---

# Volleyball Substitution Rule — Reference Texts

Эта страница хранит синхронизированные описания правила о количестве замен в одном сете. Все три текста должны оставаться семантически идентичными, чтобы чат-бот мог цитировать их на любом языке.

## 🇩🇪 Deutsch

### Regel 15.6 – Auswechslungen pro Satz
Jede Mannschaft darf pro Satz höchstens **sechs reguläre Auswechslungen** beantragen. Eine Auswechslung gilt als regulär, wenn der Ersatzspieler auf derselben Position wie der ausgewechselte Spieler eingewechselt wird. Ein Spieler darf nur durch den Ersatzspieler ersetzt werden, der ihn zuvor ersetzt hat. Diese Formulierungen stammen aus den „Offiziellen Volleyballregeln 2025‑2028“, Kapitel 15 (Spielunterbrechungen).

### Zusätzliche Hinweise
Ein Antrag auf Auswechslung wird vom Schiedsrichter nur genehmigt, wenn das Team noch innerhalb des Limits von sechs Auswechslungen liegt. Sobald die sechste Auswechslung registriert wurde, sind weitere Wechsel in diesem Satz nur bei Verletzungen или Disqualifikationen gemäß Regel 15.7 zulässig. **Quelle:** Deutscher Volleyball-Verband, Offizielle Spielregeln 2025–2028.

## 🇬🇧 English

### Rule 15.6 – Substitutions per set
Each team may request **at most six regular substitutions** per set. A regular substitution means the substitute enters in the same rotational position as the player leaving the court. A player may only be replaced by the substitute who previously replaced them. This wording comes from the “Official Volleyball Rules 2025‑2028”, Chapter 15 on game interruptions.

### Additional notes
A substitution request is approved only if the team still has available slots within the six‑substitution limit. After the sixth substitution is recorded, further changes in that set are allowed only for injury or expulsion scenarios as described in Rule 15.7. **Source:** FIVB Official Volleyball Rules 2025‑2028.

## 🇷🇺 Русский

### Правило 15.6 — Замены в одном сете
Каждая команда может заявить **максимум шесть обычных замен** в течение сета. Обычной считается замена, когда запасной выходит на ту же позицию в ротации, что и игрок, покидающий площадку. Игрок может быть заменён только тем спортсменом, который ранее выходил вместо него. Формулировка взята из «Официальных правил волейбола 2025–2028», глава 15.

### Дополнительные пояснения
Судья удовлетворяет запрос на замену, только если команда не исчерпала лимит из шести обычных замен. После регистрации шестой замены новые изменения в этом сете допустимы лишь при травме или дисквалификации в соответствии с правилом 15.7. **Источник:** Deutscher Volleyball-Verband / FIVB Official Volleyball Rules 2025–2028.

---

### Upload checklist
1. Синхронизировать изменения в этом файле.
2. Подготовить JSON-пейлоад с одинаковыми chunk-структурами (`content_id`, `language`, `chunks`).
3. Вызвать `POST /ingest-content/upload-chunks` по каждому языку.
4. Проверить результаты через `/chatbot/debug-flow`.
