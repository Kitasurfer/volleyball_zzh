import React, { useState } from 'react';
import { MapPin, Mail } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';
import { supabase } from '../lib/supabase';

const ContactPage: React.FC = () => {
  const { language } = useLanguage();
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [activeMap, setActiveMap] = useState<'gym' | 'beach'>('gym');

  const content = {
    de: {
      title: 'Kontakt',
      subtitle: 'Nehmen Sie Kontakt mit uns auf',
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
  };

  const t = content[language];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const { error } = await supabase.from('contact_submissions').insert([
        {
          name: formData.name,
          email: formData.email,
          message: formData.message,
          language: language,
        },
      ]);

      if (error) throw error;

      setStatus('success');
      setFormData({ name: '', email: '', message: '' });
      setTimeout(() => setStatus('idle'), 3000);
    } catch (error) {
      console.error('Error submitting form:', error);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-20">
      <div className="container mx-auto px-6 lg:px-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-h1 font-bold text-primary-900 mb-4">{t.title}</h1>
          <p className="text-body-lg text-neutral-700">{t.subtitle}</p>
          <div className="w-24 h-1 bg-accent-500 mx-auto mt-6"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Contact Form */}
          <div className="bg-white p-8 rounded-lg shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-small font-medium text-neutral-900 mb-2">
                  {t.form.name}
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-small font-medium text-neutral-900 mb-2">
                  {t.form.email}
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-small font-medium text-neutral-900 mb-2">
                  {t.form.message}
                </label>
                <textarea
                  required
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-4 py-3 border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                ></textarea>
              </div>
              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full bg-primary-500 text-white px-6 py-3 rounded-md font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50"
              >
                {status === 'loading' ? '...' : t.form.submit}
              </button>
              {status === 'success' && (
                <p className="text-semantic-success text-center">{t.form.success}</p>
              )}
              {status === 'error' && (
                <p className="text-semantic-error text-center">{t.form.error}</p>
              )}
            </form>
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
