import type { ComponentType, ReactNode } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../lib/LanguageContext';

interface SeoProps {
  title: string;
  description: string;
  imagePath?: string;
  noIndex?: boolean;
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>>;
}

export function Seo({
  title,
  description,
  imagePath = '/images/SKV_Volleyball.png',
  noIndex = false,
  jsonLd,
}: SeoProps) {
  const { language, t } = useLanguage();
  const location = useLocation();

  const siteUrl = (import.meta.env.VITE_SITE_URL || 'https://skvunterensingen.netlify.app').replace(/\/$/, '');
  const normalizedPath = location.pathname === '/' ? '/' : location.pathname.replace(/\/$/, '');
  const canonicalUrl = `${siteUrl}${normalizedPath}`;

  const breadcrumbId = `${canonicalUrl}#breadcrumb`;
  const pathSegments = normalizedPath.split('/').filter(Boolean);

  const imageUrl = imagePath.startsWith('http')
    ? imagePath
    : `${siteUrl}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;

  const breadcrumbNameMap: Record<string, string> = {
    about: t.nav.about,
    gallery: t.nav.gallery,
    hall: t.nav.hall,
    beach: t.nav.beach,
    training: t.nav.training,
    competitions: t.nav.competitions,
    contact: t.nav.contact,
  };

  const breadcrumbItems = [
    {
      '@type': 'ListItem',
      position: 1,
      name: t.nav.home,
      item: `${siteUrl}/`,
    },
    ...pathSegments.map((segment, index) => ({
      '@type': 'ListItem',
      position: index + 2,
      name: breadcrumbNameMap[segment] ?? segment,
      item: `${siteUrl}/${pathSegments.slice(0, index + 1).join('/')}`,
    })),
  ];

  const organizationId = `${siteUrl}#organization`;
  const websiteId = `${siteUrl}#website`;
  const webpageId = `${canonicalUrl}#webpage`;

  const baseJsonLd =
    noIndex
      ? null
      : {
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'SportsClub',
              '@id': organizationId,
              name: 'SKV Unterensingen Volleyball',
              url: siteUrl,
              logo: `${siteUrl}/images/SKV_Volleyball.png`,
              email: 'volleyball@skvunterensingen.de',
              telephone: '+4917689220007',
              address: {
                '@type': 'PostalAddress',
                streetAddress: 'Schulstraße 43',
                postalCode: '72669',
                addressLocality: 'Unterensingen',
                addressCountry: 'DE',
              },
            },
            {
              '@type': 'WebSite',
              '@id': websiteId,
              url: siteUrl,
              name: 'SKV Unterensingen Volleyball',
              inLanguage: language,
              publisher: {
                '@id': organizationId,
              },
            },
            {
              '@type': 'WebPage',
              '@id': webpageId,
              url: canonicalUrl,
              name: title,
              description,
              inLanguage: language,
              isPartOf: {
                '@id': websiteId,
              },
              about: {
                '@id': organizationId,
              },
              primaryImageOfPage: {
                '@type': 'ImageObject',
                url: imageUrl,
              },
              breadcrumb: {
                '@id': breadcrumbId,
              },
            },
            {
              '@type': 'BreadcrumbList',
              '@id': breadcrumbId,
              itemListElement: breadcrumbItems,
            },
          ],
        };

  const jsonLdBlocks = [
    ...(baseJsonLd ? [baseJsonLd] : []),
    ...(jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : []),
  ];

  const ogLocale =
    language === 'de'
      ? 'de_DE'
      : language === 'ru'
      ? 'ru_RU'
      : language === 'it'
      ? 'it_IT'
      : 'en_GB';

  const HelmetComponent = Helmet as unknown as ComponentType<{ children?: ReactNode }>;

  return (
    <HelmetComponent>
      <html lang={language} />
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="SKV Unterensingen Volleyball" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:alt" content={title} />
      <meta property="og:locale" content={ogLocale} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
      <meta name="twitter:image:alt" content={title} />

      <meta name="robots" content={noIndex ? 'noindex,nofollow' : 'index,follow'} />

      {jsonLdBlocks.map((data, index) => (
        <script key={`jsonld-${index}`} type="application/ld+json">
          {JSON.stringify(data)}
        </script>
      ))}
    </HelmetComponent>
  );
}
