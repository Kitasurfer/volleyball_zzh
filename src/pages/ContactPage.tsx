import React, { useState } from 'react';
import { MapPin, Mail, Phone, MessageCircle } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';
import { Seo } from '../components/Seo';

const ContactPage: React.FC = () => {
  const { language } = useLanguage();
  const [activeMap, setActiveMap] = useState<'gym' | 'beach'>('gym');

  const content = {
    de: {
      title: 'Kontakt',
      subtitle: 'Nehmen Sie Kontakt mit uns auf',
      fastContact: {
        title: 'Schneller Kontakt',
        subtitle: 'Wählen Sie, wie Sie uns am liebsten erreichen möchten.',
        call: 'Anrufen',
        email: 'E-Mail schreiben',
        whatsapp: 'WhatsApp-Nachricht',
        note: 'Wir melden uns in der Regel innerhalb von 24 Stunden.',
      },
      form: {
        name: 'Name',
        email: 'E-Mail',
        message: 'Nachricht',
        submit: 'Senden',
        success: 'Nachricht erfolgreich gesendet!',
        error: 'Fehler beim Senden. Bitte versuchen Sie es erneut.',
      },
      info: {
        club: 'Verein',
        contactPerson: 'Kontakt',
        phone: 'Telefon',
        trainer: 'Trainer',
        gymLocation: 'Trainingsort Halle',
        beachLocation: 'Trainingsort Beach',
        address: 'Adresse',
        email: 'E-Mail',
      },
    },
    en: {
      title: 'Contact',
      subtitle: 'Get in touch with us',
      fastContact: {
        title: 'Quick contact',
        subtitle: 'Choose how you prefer to get in touch with us.',
        call: 'Call',
        email: 'Send e-mail',
        whatsapp: 'WhatsApp message',
        note: 'We usually reply within 24 hours.',
      },
      form: {
        name: 'Name',
        email: 'Email',
        message: 'Message',
        submit: 'Submit',
        success: 'Message sent successfully!',
        error: 'Error sending message. Please try again.',
      },
      info: {
        club: 'Club',
        contactPerson: 'Contact person',
        phone: 'Phone',
        trainer: 'Coach',
        gymLocation: 'Indoor training location',
        beachLocation: 'Beach training location',
        address: 'Address',
        email: 'Email',
      },
    },
    ru: {
      title: 'Контакты',
      subtitle: 'Свяжитесь с нами',
      fastContact: {
        title: 'Быстрый контакт',
        subtitle: 'Выберите удобный способ связаться с нами.',
        call: 'Позвонить',
        email: 'Написать e-mail',
        whatsapp: 'Сообщение в WhatsApp',
        note: 'Обычно отвечаем в течение 24 часов.',
      },
      form: {
        name: 'Имя',
        email: 'Email',
        message: 'Сообщение',
        submit: 'Отправить',
        success: 'Сообщение успешно отправлено!',
        error: 'Ошибка при отправке. Пожалуйста, попробуйте снова.',
      },
      info: {
        club: 'Клуб',
        contactPerson: 'Контакт',
        phone: 'Телефон',
        trainer: 'Тренер',
        gymLocation: 'Зал',
        beachLocation: 'Пляж',
        address: 'Адрес',
        email: 'Email',
      },
    },
    it: {
      title: 'Contatti',
      subtitle: 'Mettiti in contatto con noi',
      fastContact: {
        title: 'Contatto rapido',
        subtitle: 'Scegli come preferisci contattarci.',
        call: 'Chiama',
        email: 'Invia e-mail',
        whatsapp: 'Messaggio WhatsApp',
        note: 'Di solito rispondiamo entro 24 ore.',
      },
      form: {
        name: 'Nome',
        email: 'Email',
        message: 'Messaggio',
        submit: 'Invia',
        success: 'Messaggio inviato con successo!',
        error: 'Errore durante l’invio. Riprova più tardi.',
      },
      info: {
        club: 'Club',
        contactPerson: 'Contatto',
        phone: 'Telefono',
        trainer: 'Allenatore',
        gymLocation: 'Palestra',
        beachLocation: 'Campo beach',
        address: 'Indirizzo',
        email: 'Email',
      },
    },
  };

  const t = content[language];

  const seoTitle = t.title;
  const seoDescription = t.subtitle;

  return (
    <div className="min-h-screen pt-32 pb-20">
      <Seo title={seoTitle} description={seoDescription} />
      <div className="container mx-auto px-6 lg:px-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-h1 font-bold text-primary-900 mb-4">{t.title}</h1>
          <p className="text-body-lg text-neutral-700">{t.subtitle}</p>
          <div className="w-24 h-1 bg-accent-500 mx-auto mt-6"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Quick Contact */}
          <div className="bg-white p-8 rounded-lg shadow-sm space-y-6">
            <div>
              <h2 className="text-h3 font-semibold text-neutral-900 mb-2">{t.fastContact.title}</h2>
              <p className="text-body text-neutral-700">{t.fastContact.subtitle}</p>
            </div>
            <div className="space-y-4">
              <a
                href="tel:+4917689220007"
                className="flex items-center justify-between rounded-md bg-primary-500 px-4 py-3 text-white shadow-sm transition-colors hover:bg-primary-600"
              >
                <span className="text-body-lg font-semibold">{t.fastContact.call}</span>
                <Phone className="h-5 w-5" />
              </a>
              <a
                href="mailto:volleyball@skvunterensingen.de?subject=Kontakt%20SKV%20Unterensingen%20Volleyball"
                className="flex items-center justify-between rounded-md border border-primary-500 px-4 py-3 text-primary-600 shadow-sm transition-colors hover:bg-primary-50"
              >
                <span className="text-body-lg font-semibold">{t.fastContact.email}</span>
                <Mail className="h-5 w-5" />
              </a>
              <a
                href="https://wa.me/4917689220007"
                className="flex items-center justify-between rounded-md bg-[#25D366] px-4 py-3 text-white shadow-sm transition-colors hover:bg-[#1ebe5d]"
                target="_blank"
                rel="noreferrer"
              >
                <span className="text-body-lg font-semibold">{t.fastContact.whatsapp}</span>
                <MessageCircle className="h-5 w-5" />
              </a>
            </div>
            <p className="text-small text-neutral-500">{t.fastContact.note}</p>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-lg shadow-sm space-y-6">
              <div className="flex items-start space-x-4">
                <Mail className="w-6 h-6 text-primary-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-h3 font-semibold text-neutral-900 mb-2">{t.info.club}</h3>
                  <p className="text-body text-neutral-700">
                    SKV Unterensingen Volleyball
                  </p>
                  <p className="text-body text-neutral-700">
                    {t.info.contactPerson}: Sven Kühn
                  </p>
                  <p className="text-body text-neutral-700">
                    {t.info.phone}: +4917689220007
                  </p>
                  <p className="text-body text-neutral-700">
                    {t.info.trainer}: Heinrich Treubert
                  </p>
                  <a
                    href="mailto:volleyball@skvunterensingen.de"
                    className="text-body text-primary-500 hover:text-primary-600"
                  >
                    volleyball@skvunterensingen.de
                  </a>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <MapPin className="w-6 h-6 text-primary-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-h3 font-semibold text-neutral-900 mb-2">{t.info.gymLocation}</h3>
                  <p className="text-body text-neutral-700">
                    Bettwiesenhalle<br />
                    Schulstraße 43,<br />
                    72669 Unterensingen
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <MapPin className="w-6 h-6 text-primary-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-h3 font-semibold text-neutral-900 mb-2">{t.info.beachLocation}</h3>
                  <p className="text-body text-neutral-700">
                    Beachvolleyball TSV Zizishausen<br />
                    Auf d. Insel 1,<br />
                    72622 Nürtingen
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Google Map with Tabs */}
        <div className="space-y-4">
          {/* Map Selection Tabs */}
          <div className="flex gap-4 border-b border-neutral-200">
            <button
              onClick={() => setActiveMap('gym')}
              className={`px-6 py-3 font-semibold transition-colors relative ${
                activeMap === 'gym'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                <span>{t.info.gymLocation}</span>
              </div>
            </button>
            <button
              onClick={() => setActiveMap('beach')}
              className={`px-6 py-3 font-semibold transition-colors relative ${
                activeMap === 'beach'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                <span>{t.info.beachLocation}</span>
              </div>
            </button>
          </div>

          {/* Map Container */}
          <div className="w-full h-96 bg-neutral-200 rounded-lg overflow-hidden shadow-md">
            {activeMap === 'gym' ? (
              <iframe
                key="gym-map"
                src="https://www.google.com/maps?q=Schulstraße+43,+72669+Unterensingen&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            ) : (
              <iframe
                key="beach-map"
                src="https://www.google.com/maps?q=Auf+d.+Insel+1,+72622+Nürtingen&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            )}
          </div>

          {/* Current Location Info */}
          <div className="bg-neutral-50 p-4 rounded-lg">
            <p className="text-small text-neutral-700">
              {activeMap === 'gym' ? (
                <>
                  <span className="font-semibold text-neutral-900">{t.info.gymLocation}:</span>{' '}
                  Bettwiesenhalle, Schulstraße 43, 72669 Unterensingen
                </>
              ) : (
                <>
                  <span className="font-semibold text-neutral-900">{t.info.beachLocation}:</span>{' '}
                  Beachvolleyball TSV Zizishausen, Auf d. Insel 1, 72622 Nürtingen
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
