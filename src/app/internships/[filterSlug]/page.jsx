import JobFilter from '@/JobPortal/JobFilter';
import { parseFilterSlugMetadata } from '@/utils/seo-helper';

export async function generateMetadata({ params }) {
  const { filterSlug } = await params;
  const { title, description, canonicalUrl } = parseFilterSlugMetadata(filterSlug, 'Internships');

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'CareerFast',
      images: ['https://careerfast.in/og-image.png'],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['https://careerfast.in/og-image.png'],
    },
  };
}

export default async function Page({ params }) {
  const { filterSlug } = await params;
  const { headline, canonicalUrl } = parseFilterSlugMetadata(filterSlug, 'Internships');

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://careerfast.in/" },
      { "@type": "ListItem", "position": 2, "name": "Internships", "item": "https://careerfast.in/internships" },
      { "@type": "ListItem", "position": 3, "name": headline, "item": canonicalUrl }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <JobFilter />
    </>
  );
}
