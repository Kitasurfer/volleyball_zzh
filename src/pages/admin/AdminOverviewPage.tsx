const AdminOverviewPage = () => {
  const cards = [
    {
      title: 'Content Items',
      description: 'Manage articles, translations, and publish status.',
      path: '/admin/content',
    },
    {
      title: 'Media Library',
      description: 'Upload and organize images, videos, and documents.',
      path: '/admin/media',
    },
    {
      title: 'Vector Jobs',
      description: 'Monitor ingestion queue, retry failures, and track progress.',
      path: '/admin/vector-jobs',
    },
    {
      title: 'Chat Sessions',
      description: 'Review conversations, export transcripts, and observe usage.',
      path: '/admin/chats',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-neutral-900">Welcome back!</h2>
        <p className="mt-2 text-sm text-neutral-500">
          Use the sections below to manage content, keep the vector knowledge base up to date, and
          monitor the AI assistant.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {cards.map((card) => (
          <a
            key={card.path}
            href={card.path}
            className="flex flex-col gap-2 rounded-lg border border-neutral-200 bg-neutral-50 p-5 transition hover:border-primary-400 hover:bg-white"
          >
            <h3 className="text-lg font-semibold text-neutral-800">{card.title}</h3>
            <p className="text-sm text-neutral-500">{card.description}</p>
          </a>
        ))}
      </div>
    </div>
  );
};

export default AdminOverviewPage;
