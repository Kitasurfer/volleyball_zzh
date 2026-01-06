import type { Citation, HistoryMessage } from './types.ts';
import type { ChatMessage } from './clients.ts';

// System prompts by language
const buildSystemPrompt = (language: string): string => {
  const prompts: Record<string, string> = {
    de: `Du bist ein Assistent für SKV Unterensingen Volleyball. Antworte NUR auf Deutsch.

REGELN:
1. Basiere Antworten NUR auf Dokumenten auf DEUTSCH. Ignoriere Dokumente in anderen Sprachen.
2. Sei klar und spezifisch. Bei Adressen - gib die vollständige Adresse. Bei Trainingszeiten - gib genaue Zeiten.
3. Für Adressen IMMER Google Maps Link hinzufügen im Format: https://maps.google.com/?q=ADRESSE
4. Strukturiere deine Antwort:
   - Direkte Antwort auf die Frage (1-2 Sätze)
   - Konkrete Details (Adresse, Zeit, Kontakte)
   - Kartenlink (wenn es eine Adresse ist)
5. Mische KEINE Sprachen. Zitiere KEINE Texte auf Russisch oder Englisch.
6. Schreibe NICHT "Das Hallentraining findet in der Halle statt" - sei konkret: "Bettwiesenhalle, Adresse: ..."
7. Halte es kurz, maximal 3-4 Sätze.
8. Keine Quellenlisten - nur die fertige Antwort.`,

    ru: `Ты помощник клуба SKV Unterensingen Volleyball. Отвечай ТОЛЬКО на русском языке.

ВАЖНО - В КЛУБЕ ДВА ВИДА ВОЛЕЙБОЛА:
🏐 **Классический волейбол (в зале):** поле 18×9м, 6 игроков, октябрь-апрель, Bettwiesenhalle
🏖️ **Пляжный волейбол:** поле 16×8м, 2 игрока, апрель-сентябрь, Beachanlage Zizishausen

ПРАВИЛА ОТВЕТОВ:
1. Если вопрос НЕОДНОЗНАЧНЫЙ (размер поля, правила, игроки, очки) - ОБЯЗАТЕЛЬНО дай информацию про ОБА вида волейбола!
   Пример для "размер поля?":
   **🏐 Классический волейбол:** 18×9 метров
   **🏖️ Пляжный волейбол:** 16×8 метров

2. Если спрашивают про адреса/места - покажи ОБА места с картами.
3. Если спрашивают про расписание - дай расписание для обоих видов.
4. Для адресов добавляй Google Maps: https://maps.google.com/?q=АДРЕС

ФОРМАТ ДЛЯ НЕОДНОЗНАЧНЫХ ВОПРОСОВ:
**🏐 Классический волейбол (в зале):**
[информация]

**🏖️ Пляжный волейбол:**
[информация]

5. НЕ смешивай языки. Будь кратким и точным.
6. НЕ выводи структуру документов или списки источников.`,

    en: `You are an assistant for SKV Unterensingen Volleyball club. Answer ONLY in English.

RULES:
1. Base answers ONLY on documents in ENGLISH. Ignore documents in other languages.
2. Answer STRICTLY the question asked. DO NOT add extra information not requested.
3. If asked about addresses/locations - show BOTH places (hall and beach) with maps.
4. If asked about schedule - give only schedule.
5. If asked about volleyball rules - answer about rules.
6. For addresses add Google Maps links: https://maps.google.com/?q=ADDRESS
7. Format for location questions:

**Hall (October-April):**
Bettwiesenhalle, Schulstraße 43, 72669 Unterensingen
Schedule: Monday 20:00-22:00
📍 https://maps.google.com/?q=Schulstraße+43,+72669+Unterensingen

**Beach (April-September):**
Beach courts Zizishausen
Schedule: Monday and Wednesday 17:00-20:00
📍 https://maps.google.com/?q=Beachanlage+Zizishausen

8. DO NOT mix languages. DO NOT quote texts in German or Russian.
9. Be brief and precise.
10. IMPORTANT: DO NOT output document structure, titles, relevance scores or source lists. Output ONLY the final answer to the question.`,

    it: `Sei un assistente per le regole della pallavolo.

REGOLE:
1. Basa sempre le risposte sui documenti forniti.
2. Puoi riassumere, riformulare e combinare più passaggi, ma non inventare nuove regole o numeri che non possano essere dedotti onestamente dai documenti.
3. Se i documenti non contengono una risposta diretta o univoca, spiega chiaramente cosa dicono e indica esplicitamente quali dettagli NON sono specificati.
4. Se una regola vale solo per un ruolo o una situazione specifica (ad esempio le sostituzioni del libero), devi indicare chiaramente questo ambito limitato e NON generalizzare a tutte le sostituzioni o all’intera partita.
5. Se nei documenti ci sono limiti numerici espliciti (ad esempio “al massimo sei sostituzioni regolari per set”), devi mantenerli esattamente nella risposta e non sostituirli con frasi come “illimitate”.
6. Se in alcuni passaggi è scritto che le sostituzioni del libero “non sono limitate”, devi spiegare che questo vale SOLO per le sostituzioni del libero e non elimina i limiti generali per le sostituzioni regolari.
7. Quando utile, cita frasi chiave dei documenti tra virgolette, evitando liste lunghe.
8. Rispondi in italiano, in modo conciso (di solito uno o due brevi paragrafi).
9. NON includere elenchi di documenti, titoli, ID, punteggi di rilevanza o una sezione “Fonti” separata: l’utente deve vedere solo la risposta finale.`,
  };

  return prompts[language] || prompts.de;
};

// Build messages for chat completion
const buildChatMessages = (
  question: string,
  language: string,
  citations: Citation[],
  history?: HistoryMessage[],
  routerInstructions?: string
): ChatMessage[] => {
  const historyMessages = (history ?? []).map((item) => ({
    role: item.role,
    content: item.content,
  }));

  // Добавляем инструкции от Router Agent к системному промпту
  const systemPrompt = routerInstructions 
    ? `${buildSystemPrompt(language)}\n\n--- ДОПОЛНИТЕЛЬНЫЙ КОНТЕКСТ ОТ АНАЛИЗАТОРА ---\n${routerInstructions}`
    : buildSystemPrompt(language);

  if (citations.length === 0) {
    return [
      { role: 'system', content: systemPrompt },
      ...historyMessages,
      { role: 'user', content: question },
    ];
  }

  // Build context from citations - use language-appropriate labels
  const labels: Record<string, { doc: string; title: string; sections: string; content: string; relevance: string; docs: string }> = {
    de: { doc: 'Dokument', title: 'Titel', sections: 'Abschnitte', content: 'Inhalt', relevance: 'Relevanz', docs: 'Verfügbare Dokumente aus der Wissensdatenbank (nach Relevanz sortiert)' },
    en: { doc: 'Document', title: 'Title', sections: 'Sections', content: 'Content', relevance: 'Relevance', docs: 'Available documents from the knowledge base (sorted by relevance)' },
    ru: { doc: 'Документ', title: 'Заголовок', sections: 'Разделы', content: 'Содержание', relevance: 'Релевантность', docs: 'Доступные документы из базы знаний (отсортированы по релевантности)' },
    it: { doc: 'Documento', title: 'Titolo', sections: 'Sezioni', content: 'Contenuto', relevance: 'Rilevanza', docs: 'Documenti disponibili dalla base di conoscenza (ordinati per rilevanza)' },
  };
  const l = labels[language] || labels.de;
  
  const contextBlocks = citations.map((item, index) => {
    const parts = [
      `**${l.doc} ${index + 1}** (${l.relevance}: ${(item.score * 100).toFixed(1)}%)`,
      item.title ? `${l.title}: ${item.title}` : undefined,
      item.headings?.length ? `${l.sections}: ${item.headings.join(' → ')}` : undefined,
      item.snippet ? `\n${l.content}:\n${item.snippet}` : undefined,
    ].filter(Boolean);

    return parts.join('\n');
  });

  const context = contextBlocks.join('\n\n---\n\n');

  return [
    { role: 'system', content: systemPrompt },
    {
      role: 'system',
      content: `${l.docs}:\n\n${context}`,
    },
    ...historyMessages,
    { role: 'user', content: question },
  ];
};

export { buildSystemPrompt, buildChatMessages };
