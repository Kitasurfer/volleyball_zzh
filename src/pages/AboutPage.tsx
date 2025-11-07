import React from 'react';
import { useLanguage } from '../lib/LanguageContext';

const AboutPage: React.FC = () => {
  const { language } = useLanguage();

  const content = {
    de: {
      title: 'Über SG TSV Zizishausen/SKV Unterensingen',
      sections: [
        {
          title: 'Geschichte und Philosophie',
          text: 'Die SG TSV Zizishausen/SKV Unterensingen Volleyball-Mannschaft wurde in Zizishausen gegründet, einem charmanten Stadtteil von Nürtingen im Herzen von Baden-Württemberg. Unser Name spiegelt unser Kernversprechen wider: Wir sind diejenigen, die offensive Angriffe der Gegner stoppen und verhindern.',
        },
        {
          title: 'Mission',
          text: 'Wir entwickeln Volleyball-Talente der nächsten Generation durch innovative Trainingsmethoden, während wir eine inklusive Gemeinschaft aufbauen, in der jeder Spieler sein volles Potenzial erreichen kann.',
        },
        {
          title: 'Trainingsphilosophie',
          text: 'Unser Trainingsansatz basiert auf international anerkannten Methoden, die von der FIVB entwickelt wurden. Wir folgen dem Prinzip "trainiere wie du spielst".',
        },
        {
          title: 'Chef-Trainer: Winni Schmidt',
          text: 'Winni leitet seit über 15 Jahren Volleyball-Programme in der Region und bringt eine einzigartige Mischung aus internationaler Erfahrung und lokaler Verbundenheit mit.',
        },
      ],
      location: 'Standort: Zizishausen, Baden-Württemberg',
    },
    en: {
      title: 'About SG TSV Zizishausen/SKV Unterensingen',
      sections: [
        {
          title: 'History and Philosophy',
          text: 'The SG TSV Zizishausen/SKV Unterensingen Volleyball Team was founded in Zizishausen, a charming district of Nürtingen in the heart of Baden-Württemberg. Our name reflects our core promise: We are the ones who stop and prevent offensive attacks.',
        },
        {
          title: 'Mission',
          text: 'We develop volleyball talents of the next generation through innovative training methods while building an inclusive community where every player can reach their full potential.',
        },
        {
          title: 'Training Philosophy',
          text: 'Our training approach is based on internationally recognized methods developed by the FIVB. We follow the principle "train like you play".',
        },
        {
          title: 'Head Coach: Winni Schmidt',
          text: 'Winni has been leading volleyball programs in the region for over 15 years and brings a unique blend of international experience and local connection.',
        },
      ],
      location: 'Location: Zizishausen, Baden-Württemberg',
    },
    ru: {
      title: 'О команде SG TSV Zizishausen/SKV Unterensingen',
      sections: [
        {
          title: 'История и философия',
          text: 'Команда SG TSV Zizishausen/SKV Unterensingen была основана в Цицинхаузене, очаровательном районе города Нюртинген в сердце земли Баден-Вюртемберг. Наше название отражает наше главное обещание: мы те, кто останавливает и предотвращает атакующие удары.',
        },
        {
          title: 'Миссия',
          text: 'Мы развиваем таланты волейбола следующего поколения через инновационные методы тренировок, создавая инклюзивное сообщество, где каждый игрок может раскрыть свой полный потенциал.',
        },
        {
          title: 'Тренировочная философия',
          text: 'Наш тренировочный подход основан на международно признанных методах, разработанных FIVB. Мы следуем принципу "тренируйся как играешь".',
        },
        {
          title: 'Главный тренер: Винни Шмидт',
          text: 'Винни руководит волейбольными программами в регионе более 15 лет и приносит уникальное сочетание международного опыта и местной связи.',
        },
      ],
      location: 'Расположение: Цицинхаузен, Баден-Вюртемберг',
    },
  };

  const t = content[language];

  return (
    <div className="min-h-screen pt-32 pb-20">
      <div className="container mx-auto px-6 lg:px-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-h1 font-bold text-primary-900 mb-4">{t.title}</h1>
          <div className="w-24 h-1 bg-accent-500 mx-auto"></div>
        </div>

        {/* Image Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <img
            src="/images/Zuzenhausen_Rathaus_Alte_Schule_Baden_Wurttemberg_Germany.jpg"
            alt="Zuzenhausen Town Hall"
            className="w-full h-64 object-cover rounded-lg shadow-md"
          />
          <img
            src="/images/Zuzenhausen_town_Germany_Baden-Wurttemberg_street_view.jpg"
            alt="Zuzenhausen Street View"
            className="w-full h-64 object-cover rounded-lg shadow-md"
          />
          <img
            src="/images/Zuzenhausen_Germany_Baden_Wurttemberg_town_street_church.jpg"
            alt="Zuzenhausen Church"
            className="w-full h-64 object-cover rounded-lg shadow-md"
          />
        </div>

        {/* Content Sections */}
        <div className="max-w-4xl mx-auto space-y-12">
          {t.sections.map((section, index) => (
            <div key={index} className="bg-white p-8 rounded-lg shadow-sm">
              <h2 className="text-h3 font-semibold text-primary-900 mb-4">{section.title}</h2>
              <p className="text-body text-neutral-700 leading-relaxed">{section.text}</p>
            </div>
          ))}
          
          <div className="bg-primary-50 p-8 rounded-lg text-center">
            <p className="text-body-lg font-semibold text-primary-900">{t.location}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
