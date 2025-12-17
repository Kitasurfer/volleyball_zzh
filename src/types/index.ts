export const SUPPORTED_LANGUAGES = ['de', 'en', 'ru', 'it'] as const;

export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export interface Translation {
  nav: {
    home: string;
    about: string;
    gallery: string;
    hall: string;
    beach: string;
    training: string;
    competitions: string;
    contact: string;
  };
  hero: {
    title: string;
    subtitle: string;
    cta: string;
  };
  footer: {
    about: string;
    contact: string;
    quickLinks: string;
    followUs: string;
    copyright: string;
  };
  chatbot: {
    title: string;
    placeholder: string;
    inputPlaceholder: string;
    send: string;
    copy: string;
    sources: string;
    noSources: string;
    downloadSource: string;
  };
  admin: {
    nav: {
      backToSite: string;
      headerTitle: string;
      items: {
        overview: string;
        content: string;
        media: string;
        albums: string;
        vectorJobs: string;
        chats: string;
      };
    };
    overview: {
      title: string;
      subtitle: string;
      cards: {
        contentTitle: string;
        contentDescription: string;
        mediaTitle: string;
        mediaDescription: string;
        vectorTitle: string;
        vectorDescription: string;
        chatsTitle: string;
        chatsDescription: string;
      };
    };
    media: {
      pageTitle: string;
      pageSubtitle: string;
      loading: string;
      loadErrorPrefix: string;
      deleteErrorPrefix: string;
      deleteSuccess: string;
      upload: {
        sourceLabel: string;
        sourceFile: string;
        sourceUrl: string;
        languageLabel: string;
        languageAll: string;
        albumLabel: string;
        albumNone: string;
        titleLabel: string;
        titlePlaceholder: string;
        descriptionLabel: string;
        descriptionPlaceholder: string;
        infoText: string;
        submitUploading: string;
        submitDefault: string;
        successMessage: string;
      };
      filters: {
        searchLabel: string;
        searchPlaceholder: string;
        languageLabel: string;
        languageAll: string;
        mediaTypeLabel: string;
        mediaAll: string;
        mediaImage: string;
        mediaVideo: string;
        mediaDocument: string;
        mediaAudio: string;
        mediaOther: string;
      };
    };
    content: {
      pageTitle: string;
      pageSubtitle: string;
      refresh: string;
      newContent: string;
      loading: string;
      loadErrorPrefix: string;
      actionErrorPrefix: string;
      deleteErrorPrefix: string;
      deleteSuccess: string;
      filters: {
        searchLabel: string;
        searchPlaceholder: string;
        statusLabel: string;
        statusAll: string;
        statusDraft: string;
        statusReview: string;
        statusPublished: string;
        languageLabel: string;
        languageAll: string;
      };
      editor: {
        titleCreate: string;
        titleEdit: string;
        subtitleCreate: string;
        subtitleEdit: string;
        close: string;
        loadingDetails: string;
        fieldTitle: string;
        fieldSlug: string;
        fieldLanguage: string;
        fieldStatus: string;
        statusDraft: string;
        statusReview: string;
        statusPublished: string;
        fieldType: string;
        fieldSummary: string;
        fieldTags: string;
        fieldPublishedAt: string;
        fieldBodyMarkdown: string;
        fieldBodyHtml: string;
        cancel: string;
        submitCreate: string;
        submitUpdate: string;
        submitSaving: string;
      };
    };
    albums: {
      pageTitle: string;
      pageSubtitle: string;
      newAlbum: string;
      detailsTitle: string;
      slugLabel: string;
      slugPlaceholder: string;
      categoryLabel: string;
      categoryTeam: string;
      categoryAction: string;
      categoryBeach: string;
      categoryTraining: string;
      categoryEvents: string;
      categoryOther: string;
      seasonLabel: string;
      seasonPlaceholder: string;
      eventDateLabel: string;
      statusLabel: string;
      statusDraft: string;
      statusPublished: string;
      statusArchived: string;
      translationsTitle: string;
      fieldTitle: string;
      fieldSubtitle: string;
      fieldDescription: string;
      listTitle: string;
      listLoading: string;
      listEmpty: string;
      listNoSeason: string;
      saveSaving: string;
      saveDefault: string;
      errorPrefix: string;
      successSaved: string;
    };
    vectorJobs: {
      pageTitle: string;
      pageSubtitle: string;
      refresh: string;
      loading: string;
      loadErrorPrefix: string;
    };
    chats: {
      pageTitle: string;
      pageSubtitle: string;
      refresh: string;
      loadingSessions: string;
    };
  };
}

export interface ContactForm {
  name: string;
  email: string;
  message: string;
  language: Language;
}
