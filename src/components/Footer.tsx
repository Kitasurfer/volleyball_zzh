import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Mail, Phone } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';

const Footer: React.FC = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-primary-900 text-white">
      <div className="container mx-auto px-6 lg:px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* About */}
          <div>
            <h3 className="text-xl font-bold mb-4">{t.footer.about}</h3>
            <p className="text-neutral-100 leading-relaxed">
              SG TSV Zizishausen/SKV Unterensingen Volleyball Team - Zizishausen, Deutschland. 
              Wir entwickeln Volleyball-Talente durch innovative Trainingsmethoden.
            </p>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xl font-bold mb-4">{t.footer.contact}</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 mt-1 flex-shrink-0" />
                <span className="text-neutral-100">
                  Inselhalle<br />
                  74915 Waibstadt-Zizishausen<br />
                  Deutschland
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 flex-shrink-0" />
                <a href="mailto:info@zizishausen-volleyball.de" className="text-neutral-100 hover:text-accent-500 transition-colors">
                  info@zizishausen-volleyball.de
                </a>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 flex-shrink-0" />
                <a href="tel:+491234567890" className="text-neutral-100 hover:text-accent-500 transition-colors">
                  +49 123 456 7890
                </a>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-bold mb-4">Quick Links</h3>
            <div className="space-y-2">
              <Link to="/about" className="block text-neutral-100 hover:text-accent-500 transition-colors">
                {t.nav.about}
              </Link>
              <Link to="/gallery" className="block text-neutral-100 hover:text-accent-500 transition-colors">
                {t.nav.gallery}
              </Link>
              <Link to="/contact" className="block text-neutral-100 hover:text-accent-500 transition-colors">
                {t.nav.contact}
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-600 mt-12 pt-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-neutral-100 text-sm">{t.footer.copyright}</p>
            <Link 
              to="/admin/login" 
              className="text-xs text-neutral-400 hover:text-accent-500 transition-colors opacity-50 hover:opacity-100"
            >
              Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
