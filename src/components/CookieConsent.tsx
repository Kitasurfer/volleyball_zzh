import { useEffect, useState } from 'react';
import type { Language } from '../types';
import { useLanguage } from '../lib/LanguageContext';

const STORAGE_KEY = 'cookie-consent-v1';

const messages: Record<Language, { text: string; button: string }> = {
  de: {
    text:
      'Wir verwenden nur technisch notwendige Cookies (z.B. zur Sprachauswahl und zur Sicherstellung der Funktion unserer Website). Durch die weitere Nutzung der Seite stimmst du dem zu.',
    button: 'Verstanden',
  },
  en: {
    text:
      'We only use technically necessary cookies (for example to remember your language and keep the site running). By continuing to use this site you agree to this.',
    button: 'OK',
  },
  ru: {
    text:
      'Мы используем только технически необходимые cookie (например, чтобы запомнить язык и обеспечить работу сайта). Продолжая пользоваться сайтом, вы соглашаетесь с этим.',
    button: 'Понятно',
  },
};

const CookieConsent = () => {
  const { language } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        setVisible(true);
      }
    } catch {
      setVisible(true);
    }
  }, []);

  const handleAccept = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, 'accepted');
    } catch {
      // ignore write errors
    }
    setVisible(false);
  };

  if (!visible) return null;

  const msg = messages[language] ?? messages.de;

  return (
    <div className="fixed inset-x-0 bottom-4 z-40 px-4 pointer-events-none">
      <div className="pointer-events-auto mx-auto flex max-w-2xl flex-col gap-3 rounded-2xl border border-neutral-700 bg-neutral-900/95 px-4 py-3 text-sm text-white shadow-lg sm:flex-row sm:items-center sm:px-6 sm:py-4">
        <p className="flex-1 leading-snug">{msg.text}</p>
        <button
          type="button"
          onClick={handleAccept}
          className="inline-flex items-center justify-center self-start rounded-md bg-accent-500 px-3 py-1.5 text-sm font-semibold text-neutral-900 transition-colors hover:bg-accent-400 sm:self-center"
        >
          {msg.button}
        </button>
      </div>
    </div>
  );
};

export default CookieConsent;
