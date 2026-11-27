import { notFound } from 'next/navigation';
import JobDetails from '@/JobPortal/JobDetails';
import { fetchJobForSEO, getAbsoluteMediaUrl } from '@/utils/seo-fetch';
import { cleanHtmlText, formatJobCompany } from '@/utils/seo-helper';

export async function generateMetadata({ params, searchParams }) {
  const { slug } = await params;
  const sParams = searchParams ? await searchParams : {};
  const isPreview = sParams?.preview === 'true';
  const previewToken = sParams?.preview_token || sParams?.token;
  const jobId = slug.split("-").pop();

  const job = await fetchJobForSEO(jobId, { preview: isPreview, preview_token: previewToken });

  if (!job) {
    return {
      title: "Scholarship Not Found | CareerFast",
      description: "The requested scholarship listing could not be found.",
      robots: { index: false, follow: false },
    };
  }

  const siteName = 'CareerFast';
  const fullTitle = `${job.job_title} Scholarship | ${siteName}`;
  const cleanDescription = cleanHtmlText(job.seo_description || job.job_description || '').substring(0, 160)
    || `Apply for ${job.job_title} scholarship. Unlock educational opportunities on CareerFast.`;
  const canonicalUrl = `https://www.careerfast.in/scholarship-details/${slug}`;
  const imageUrl = getAbsoluteMediaUrl(job.company_logo, 'https://www.careerfast.in/og-image.png');

  return {
    title: fullTitle,
    description: cleanDescription,
    robots: { index: true, follow: true },
    openGraph: {
      title: fullTitle,
      description: cleanDescription,
      url: canonicalUrl,
      siteName: siteName,
      images: [
        {
          url: imageUrl,
          width: 800,
          height: 600,
          alt: job.job_title,
        },
      ],
      locale: "en_US",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: cleanDescription,
      images: [imageUrl],
    },
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function Page({ params, searchParams }) {
  const { slug } = await params;
  const sParams = searchParams ? await searchParams : {};
  const isPreview = sParams?.preview === 'true';
  const previewToken = sParams?.preview_token || sParams?.token;
  const jobId = slug.split("-").pop();

  const job = await fetchJobForSEO(jobId, { preview: isPreview, preview_token: previewToken });

  if (!job && !isPreview) {
    notFound();
  }

  const canonicalUrl = `https://www.careerfast.in/scholarship-details/${slug}`;
  const providerName = job ? formatJobCompany(job) : "CareerFast";

  const scholarshipJsonLd = job ? {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": `${job.job_title} Scholarship`,
    "description": cleanHtmlText(job.seo_description || job.job_description || '').substring(0, 300),
    "url": canonicalUrl,
    "datePublished": job.created_at,
    "publisher": {
      "@type": "Organization",
      "name": providerName,
      "url": "https://www.careerfast.in"
    }
  } : null;

  const breadcrumbJsonLd = job ? {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.careerfast.in/" },
      { "@type": "ListItem", "position": 2, "name": "Scholarships", "item": "https://www.careerfast.in/scholarship" },
      { "@type": "ListItem", "position": 3, "name": job.job_title, "item": canonicalUrl }
    ]
  } : null;

  return (
    <>
      {scholarshipJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify([scholarshipJsonLd, breadcrumbJsonLd]) }}
        />
      )}
      <JobDetails initialData={job} serverSlug={slug} isPreview={isPreview} previewToken={previewToken} />
    </>
  );
}
