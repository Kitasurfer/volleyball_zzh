import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Mail, Phone } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';

const Footer: React.FC = () => {
  const { t } = useLanguage();

  const foundingYear = 1898;
  const currentYear = new Date().getFullYear();
  const yearRange =
    foundingYear === currentYear ? `${currentYear}` : `${foundingYear}–${currentYear}`;

  return (
    <footer className="bg-primary-900 text-white">
      <div className="container mx-auto px-6 lg:px-12 py-16">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
          <div className="space-y-4">
            <Link to="/" className="inline-flex items-center gap-3">
              <img
                src="/images/SKV_Volleyball.png"
                alt="SKV Unterensingen Volleyball logo"
                className="h-12 w-auto rounded-lg bg-white/10"
              />
              <span className="text-lg font-semibold leading-tight">
                SKV Unterensingen
                <span className="block text-sm font-normal text-neutral-200">Volleyball</span>
              </span>
            </Link>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xl font-bold mb-4">{t.footer.contact}</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 mt-1 flex-shrink-0" />
                <span className="text-neutral-100">
                  Bettwiesenhalle
                  <br />
                  Schulstraße 43
                  <br />
                  72669 Unterensingen
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 flex-shrink-0" />
                <a
                  href="mailto:volleyball@skvunterensingen.de"
                  className="text-neutral-100 hover:text-accent-500 transition-colors"
                >
                  volleyball@skvunterensingen.de
                </a>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 flex-shrink-0" />
                <a
                  href="tel:+4917689220007"
                  className="text-neutral-100 hover:text-accent-500 transition-colors"
                >
                  +4917689220007
                </a>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-bold mb-4">{t.footer.quickLinks}</h3>
            <div className="space-y-2">
              <Link
                to="/about"
                className="block text-neutral-100 hover:text-accent-500 transition-colors"
              >
                {t.nav.about}
              </Link>
              <Link
                to="/gallery"
                className="block text-neutral-100 hover:text-accent-500 transition-colors"
              >
                {t.nav.gallery}
              </Link>
              <Link
                to="/contact"
                className="block text-neutral-100 hover:text-accent-500 transition-colors"
              >
                {t.nav.contact}
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-600 mt-12 pt-8">
          <div className="flex flex-col items-center gap-2 text-center">
            <p className="text-neutral-100 text-sm">
              © {yearRange} {t.footer.copyright}
            </p>
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
