export type Language = 'de' | 'en' | 'ru';

export interface Translation {
  nav: {
    home: string;
    about: string;
    gallery: string;
    hall: string;
    beach: string;
    training: string;
    competitions: string;
    contact: string;
  };
  hero: {
    title: string;
    subtitle: string;
    cta: string;
  };
  footer: {
    about: string;
    contact: string;
    followUs: string;
    copyright: string;
  };
  chatbot: {
    title: string;
    placeholder: string;
    send: string;
    sources: string;
    noSources: string;
  };
}

export interface ContactForm {
  name: string;
  email: string;
  message: string;
  language: Language;
}
