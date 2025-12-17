import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Globe } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';
import { Language, SUPPORTED_LANGUAGES } from '../types';
import { LightboxImage } from './LightboxImage';

const Header: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { to: '/', label: t.nav.home },
    { to: '/about', label: t.nav.about },
    { to: '/gallery', label: t.nav.gallery },
    { to: '/hall', label: t.nav.hall },
    { to: '/beach', label: t.nav.beach },
    { to: '/training', label: t.nav.training },
    { to: '/competitions', label: t.nav.competitions },
    { to: '/contact', label: t.nav.contact },
  ];

  const languages: { code: Language; label: string }[] = SUPPORTED_LANGUAGES.map((code) => ({
    code,
    label: code.toUpperCase(),
  })) as { code: Language; label: string }[];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 text-white ${
        isScrolled ? 'bg-gradient-to-r from-[#1f4588] to-[#25509a] shadow-lg' : 'bg-gradient-to-r from-[#25509a] to-[#1f4588] shadow-md'
      }`}
    >
      <div className="container mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-20 gap-6">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <LightboxImage
              src="/images/SKV_Volleyball.png"
              alt="SKV Unterensingen Volleyball"
              className="h-12 w-auto object-contain"
            />
            <span className="text-xl font-bold hidden sm:block text-white">
              SKV Unterensingen Volleyball
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex flex-1 items-center justify-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`text-base font-medium whitespace-nowrap transition-colors duration-200 ${
                  location.pathname === link.to
                    ? 'text-white'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Language Switcher */}
          <div className="hidden lg:flex items-center flex-shrink-0">
            <div className="relative inline-flex group">
              <button
                type="button"
                className="flex items-center gap-2 px-3 py-1 rounded-md text-sm font-medium bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <Globe className="w-5 h-5" />
                <span>{languages.find((lang) => lang.code === language)?.label ?? language.toUpperCase()}</span>
              </button>
              <div className="absolute right-0 top-full hidden pt-2 group-hover:block group-focus-within:block">
                <div className="min-w-[140px] w-full rounded-2xl bg-white text-primary-900 shadow-lg ring-1 ring-black/5 overflow-hidden">
                  <ul className="py-1 text-sm">
                    {languages
                      .filter((lang) => lang.code !== language)
                      .map((lang) => (
                        <li key={lang.code}>
                          <button
                            onClick={() => setLanguage(lang.code)}
                            className="w-full px-4 py-2 text-left hover:bg-primary-50 hover:text-primary-700 transition-colors"
                          >
                            {lang.label}
                          </button>
                        </li>
                      ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2 text-white/80 hover:text-white"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden py-4 border-t border-white/20">
            <nav className="flex flex-col space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setIsMenuOpen(false)}
                  className={`text-base font-medium transition-colors duration-200 ${
                    location.pathname === link.to
                      ? 'text-white'
                      : 'text-white/80 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="flex items-center space-x-2 mt-6 pt-4 border-t border-white/20">
              <Globe className="w-5 h-5 text-white/80" />
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-200 border border-white/40 ${
                    language === lang.code
                      ? 'bg-white text-[#25509a]'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
