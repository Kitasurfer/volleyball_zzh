import React, { useState } from 'react';
import { MapPin, Mail } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';
import { supabase } from '../lib/supabase';

const ContactPage: React.FC = () => {
  const { language } = useLanguage();
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

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
            <div className="bg-white p-8 rounded-lg shadow-sm">
              <div className="flex items-start space-x-4 mb-6">
                <MapPin className="w-6 h-6 text-primary-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-h3 font-semibold text-neutral-900 mb-2">{t.info.address}</h3>
                  <p className="text-body text-neutral-700">
                    Inselhalle<br />
                    74915 Waibstadt-Zizishausen<br />
                    Deutschland
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <Mail className="w-6 h-6 text-primary-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-h3 font-semibold text-neutral-900 mb-2">{t.info.email}</h3>
                  <a
                    href="mailto:info@blockbuster-volleyball.de"
                    className="text-body text-primary-500 hover:text-primary-600"
                  >
                    info@blockbuster-volleyball.de
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Google Map */}
        <div className="w-full h-96 bg-neutral-200 rounded-lg overflow-hidden shadow-md">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2612.5!2d9.347777!3d49.291111!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDnCsDE3JzI4LjAiTiA5wrAyMCc1My4wIkU!5e0!3m2!1sen!2sde!4v1234567890"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          ></iframe>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
