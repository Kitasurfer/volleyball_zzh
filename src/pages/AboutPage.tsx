import React from 'react';
import { useLanguage } from '../lib/LanguageContext';
import { LightboxImage } from '../components/LightboxImage';

const AboutPage: React.FC = () => {
  const { language } = useLanguage();

  const content = {
    de: {
      title: 'Über SKV Unterensingen Volleyball',
      sections: [
        {
          title: 'Geschichte und Philosophie',
          text: 'Satzung des Sport- und Kulturvereins Unterensingen e.V. (in der Fassung vom 12.3.2010) A. Name, Sitz und Zweck § 1 1. Der Verein führt den Namen Sport- und Kulturverein Unterensingen e.V. und hat seinen Sitz in Unterensingen. 2. Der Verein ist im Vereinsregister des Amtsgerichts Nürtingen-Esslingen eingetragen. § 2 1. Der Sport- und Kulturverein e.V. verfolgt ausschließlich und unmittelbar gemeinnützige Zwecke im Sinne des Abschnitts „Steuerbegünstigte Zwecke“ der Abgabenordnung. 2. Zwecke des Vereins sind a) Zeitgemäßes Anbieten von geordneten Sport- und Spielübungen, Rundenspielen und Sportveranstaltungen sowie Kursen aller Art, welche zur Erhaltung und zur Förderung der einzelnen Abteilungen notwendig sind. b) Ausbildung und Anstellung von Betreuern, Übungsleitern und Sportlehrern zur Durchführung des unter 2a) aufgeführten Programms. c) Jugendpflege, Abhaltung zweckdienlicher Vorträge, Lehrgänge und Versammlungen, Bildung besonderer Kinder- und Jugendabteilungen. 3. Der Verein ist selbstlos tätig; er verfolgt nicht in erster Linie eigenwirtschaftliche Zwecke. 4. Mittel des Vereins sind zur Erfüllung des satzungsgemäßen Zwecks sowie zur Erhaltung und Erneuerung der Vereinseinrichtungen zu verwenden. Die Mitglieder erhalten keine Zuwendungen aus Mitteln des Vereins, ausgenommen sind Aufwendungen für die Übungsleiterpauschale gem. §3 Nr. 26 EStG und Aufwandsentschädigungen gem. §3 Nr. 26a EStG. 5. Ansammlung von Vermögen zu anderen Zwecken ist untersagt. Vereinsmitglieder oder Dritte erhalten keine Gewinnanteile. Niemand darf durch Vereinsausgaben, die dem Vereinszweck fremd sind, oder durch unverhältnismäßig hohe Vergütungen begünstigt werden. Politische, rassische oder religiöse Zwecke dürfen innerhalb des Vereins nicht angestrebt werden',
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
          title: 'Chef-Trainer: Heinrich Treibert',
          text:
            'Heinrich Treibert leitet die Volleyballprogramme in der Region und ist für seinen professionellen Ansatz in der Spielerentwicklung bekannt. Er verbindet langjährige Trainererfahrung mit einem tiefen Verständnis für Spielprozesse und Teamdynamik.',
        },
      ],
      location: 'Standort: Unterensingen, Baden-Württemberg',
    },
    en: {
      title: 'About SKV Unterensingen Volleyball',
      sections: [
        {
          title: 'History and Philosophy',
          text:
            'Statutes of the Sports and Culture Club Unterensingen e.V. (version adopted on 12 March 2010) A. Name, registered office and purpose § 1 1. The club bears the name Sports and Culture Club Unterensingen e.V. and has its registered office in Unterensingen. 2. The club is entered in the register of associations of the Local Court of Nürtingen-Esslingen. § 2 1. The Sports and Culture Club e.V. pursues exclusively and directly charitable purposes within the meaning of the section "tax-privileged purposes" of the German Fiscal Code. 2. The purposes of the club are a) to offer up-to-date, structured sports and games training sessions, league fixtures and sports events as well as courses of all kinds which are necessary for the maintenance and promotion of the individual departments. b) the training and employment of supervisors, trainers and sports teachers for the implementation of the programme listed under 2 a). c) youth work, holding appropriate lectures, courses and meetings, and creating special children s and youth departments. 3. The club operates selflessly; it does not primarily pursue its own economic purposes. 4. The funds of the club are to be used to fulfil the statutory purposes as well as to maintain and renew the club facilities. Members do not receive any benefits from the funds of the club, with the exception of expense allowances for the trainer flat rate pursuant to §3 no. 26 of the German Income Tax Act (EStG) and expense reimbursements pursuant to §3 no. 26a EStG. 5. The accumulation of assets for other purposes is prohibited. Club members or third parties do not receive any profit shares. No person may be favoured by expenditure that is foreign to the purpose of the club or by disproportionately high remuneration. Political, racist or religious purposes may not be pursued within the club.',
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
          title: 'Head Coach: Heinrich Treibert',
          text:
            'Heinrich Treibert leads the volleyball programs in the region and is known for his professional approach to player development. He combines many years of coaching experience with a deep understanding of game processes and team dynamics.',
        },
      ],
      location: 'Location: Unterensingen, Baden-Württemberg',
    },
    ru: {
      title: 'О команде SKV Unterensingen Volleyball',
      sections: [
        {
          title: 'История и философия',
          text:
            'Устав спортивно-культурного объединения Unterensingen e.V. (в редакции от 12.03.2010) A. Наименование, местонахождение и цели § 1 1. Объединение носит название Sport- und Kulturverein Unterensingen e.V. и имеет местонахождение в Унтерензингене. 2. Объединение внесено в реестр объединений участкового суда Нюртинген-Эсслинген. § 2 1. Sport- und Kulturverein e.V. преследует исключительно и непосредственно общественно полезные цели в смысле раздела «льготируемые в налоговом отношении цели» Налогового кодекса ФРГ. 2. Целями объединения являются: a) современная организация систематических спортивных и игровых занятий, лиговых игр и спортивных мероприятий, а также курсов любого вида, необходимых для сохранения и развития отдельных отделений. b) подготовка и наём сопровождающих лиц, тренеров и преподавателей физкультуры для реализации программы, указанной в пункте 2 a). c) работа с молодёжью, проведение соответствующих лекций, семинаров и собраний, создание специальных детских и молодёжных отделений. 3. Объединение действует бескорыстно; оно не преследует в первую очередь собственных хозяйственных целей. 4. Средства объединения используются для достижения целей, предусмотренных уставом, а также для содержания и обновления инфраструктуры объединения. Члены не получают выплат из средств объединения, за исключением вознаграждений в рамках освобождения для тренеров согласно §3 № 26 EStG и компенсаций расходов согласно §3 № 26a EStG. 5. Накопление имущества в иных целях запрещено. Члены объединения или третьи лица не получают доли прибыли. Никто не может быть поставлен в преимущественное положение за счёт расходов, не служащих целям объединения, либо путём несоразмерно высоких вознаграждений. В рамках объединения не допускается преследование политических, расистских или религиозных целей.',
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
          title: 'Главный тренер: Heinrich Treibert',
          text:
            'Heinrich Treibert руководит волейбольными программами в регионе и известен своим профессиональным подходом к развитию игроков. Он сочетает многолетний тренерский опыт с глубоким пониманием игровых процессов и командной динамики.',
        },
      ],
      location: 'Расположение: Унтерензинген, Баден-Вюртемберг',
    },
  };

  const aboutSections = {
    de: [
      {
        title: 'Geschichte und Philosophie',
        text:
          'Im Sport- und Kulturverein Unterensingen e.V. bedeutet Sport vor allem Freude, Bewegung und positive Emotionen. Bei uns kann jeder dem Alltag entfliehen, neue Energie tanken und Spaß am Spiel und am Miteinander erleben. Wir bringen Menschen aller Altersklassen und Leistungsstufen zusammen. Uns ist wichtig, dass sich jeder als Teil des Teams fühlt, sich in seinem eigenen Tempo entwickelt und jeden Fortschritt genießt. Sport für Körper, Kopf und Seele – so verstehen wir unsere Philosophie. Gemeinsam aktiv. Gemeinsam stark. Gemeinsam Unterensingen.',
      },
      {
        title: 'Unsere Mission – Sport mit Spaß',
        text:
          'Wir helfen Menschen, Volleyball für sich zu entdecken – mit modernem Training, motivierender Betreuung und einer positiven Atmosphäre. Für uns zählt nicht nur das Ergebnis – sondern die Freude an jeder Trainingseinheit, jedem Spielzug und jedem Fortschritt.',
      },
      {
        title: 'Trainingsphilosophie',
        text:
          'Unser Trainingsansatz basiert auf international anerkannten Methoden, die von der FIVB entwickelt wurden. Wir folgen dem Prinzip "trainiere wie du spielst".',
      },
      {
        title: 'Chef-Trainer: Heinrich Treibert',
        text:
          'Heinrich Treibert leitet die Volleyballprogramme in der Region und ist für seinen professionellen Ansatz in der Spielerentwicklung bekannt. Er verbindet langjährige Trainererfahrung mit einem tiefen Verständnis für Spielprozesse und Teamdynamik.',
      },
    ],
    en: [
      {
        title: 'History and Philosophy',
        text:
          'At the Sports and Culture Club Unterensingen e.V., sports are about joy, movement, and positive emotions. Here, everyone can take a break from everyday life, recharge and enjoy the game and the community. We unite people of all ages and skill levels. It matters to us that everyone feels part of the team, develops at their own pace, and enjoys every step of progress. Sports for the body, mind, and soul — that’s our philosophy. Active together. Strong together. Together Unterensingen.',
      },
      {
        title: 'Our Mission – Sport with Enjoyment',
        text:
          'We help people discover volleyball for themselves — with modern training, supportive coaches, and a positive atmosphere. For us, it is not only about results — but about enjoying every practice, every play, and every success.',
      },
      {
        title: 'Training Philosophy',
        text:
          'Our training approach is based on internationally recognized methods developed by the FIVB. We follow the principle "train like you play".',
      },
      {
        title: 'Head Coach: Heinrich Treibert',
        text:
          'Heinrich Treibert leads the volleyball programs in the region and is known for his professional approach to player development. He combines many years of coaching experience with a deep understanding of game processes and team dynamics.',
      },
    ],
    ru: [
      {
        title: 'История и философия',
        text:
          'В спортивном и культурном клубе Унтерензингена e.V. спорт — это удовольствие, движение и яркие эмоции. У нас каждый может отвлечься от повседневных забот, зарядиться энергией и получить радость от игры и общения. Мы объединяем людей всех возрастов и уровней подготовки. Нам важно, чтобы каждый чувствовал себя частью команды, развивался в своём темпе и наслаждался каждым шагом вперёд. Спорт для тела, головы и души — так мы видим свою философию. Вместе активные. Вместе сильные. Вместе — Унтерензинген.',
      },
      {
        title: '⭐ Наша миссия — спорт с удовольствием',
        text:
          'Мы помогаем людям открывать волейбол для себя: с современными тренировками, поддержкой тренеров и позитивной атмосферой. Для нас важны не только результаты — но и удовольствие от каждой тренировки, каждого розыгрыша и каждого успеха.',
      },
      {
        title: 'Тренировочная философия',
        text:
          'Наш тренировочный подход основан на международно признанных методах, разработанных FIVB. Мы следуем принципу "тренируйся как играешь".',
      },
      {
        title: 'Главный тренер: Heinrich Treibert',
        text:
          'Heinrich Treibert руководит волейбольными программами в регионе и известен своим профессиональным подходом к развитию игроков. Он сочетает многолетний тренерский опыт с глубоким пониманием игровых процессов и командной динамики.',
      },
    ],
  } as const;

  const t = {
    ...content[language],
    sections: aboutSections[language],
  };

  return (
    <div className="min-h-screen pt-32 pb-20">
      <div className="container mx-auto px-6 lg:px-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-h1 font-bold text-primary-900 mb-4 break-words text-balance">{t.title}</h1>
          <div className="w-24 h-1 bg-accent-500 mx-auto"></div>
        </div>

        {/* Image Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <LightboxImage
            src="https://kxwmkvtxkaczuonnnxlj.supabase.co/storage/v1/object/public/media-public/uploads/1764959135863-sjksui.jpg"
            alt="Unterensingen city panorama"
            className="w-full h-64 object-cover rounded-lg shadow-md"
          />
          <LightboxImage
            src="https://kxwmkvtxkaczuonnnxlj.supabase.co/storage/v1/object/public/media-public/uploads/1764959134133-sdffg3.jpg"
            alt="Unterensingen church"
            className="w-full h-64 object-cover rounded-lg shadow-md"
          />
          <LightboxImage
            src="https://kxwmkvtxkaczuonnnxlj.supabase.co/storage/v1/object/public/media-public/uploads/1764960618120-6ouhh8.jpg"
            alt="Unterensingen view"
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
