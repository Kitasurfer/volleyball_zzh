import { Link } from 'react-router-dom';
import { useLanguage } from '../../lib/LanguageContext';

const AdminOverviewPage = () => {
  const { t } = useLanguage();
  const admin = t.admin.overview;

  const cards = [
    {
      title: admin.cards.contentTitle,
      description: admin.cards.contentDescription,
      path: '/admin/content',
    },
    {
      title: admin.cards.mediaTitle,
      description: admin.cards.mediaDescription,
      path: '/admin/media',
    },
    {
      title: admin.cards.vectorTitle,
      description: admin.cards.vectorDescription,
      path: '/admin/vector-jobs',
    },
    {
      title: admin.cards.chatsTitle,
      description: admin.cards.chatsDescription,
      path: '/admin/chats',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-neutral-900">{admin.title}</h2>
        <p className="mt-2 text-sm text-neutral-500">{admin.subtitle}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {cards.map((card) => (
          <Link
            key={card.path}
            to={card.path}
            className="flex flex-col gap-2 rounded-lg border border-neutral-200 bg-neutral-50 p-5 transition hover:border-primary-400 hover:bg-white"
          >
            <h3 className="text-lg font-semibold text-neutral-800">{card.title}</h3>
            <p className="text-sm text-neutral-500">{card.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default AdminOverviewPage;
