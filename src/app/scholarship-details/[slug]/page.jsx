import JobDetails from '@/JobPortal/JobDetails';
import { fetchJobForSEO } from '@/utils/seo-fetch';

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
      description: "The requested scholarship listing could not be found."
    };
  }

  const siteName = 'CareerFast';
  const fullTitle = `${job.job_title} Scholarship | ${siteName}`;
  const cleanDescription = job.seo_description || (job.job_description ? 
    job.job_description.replace(/<[^>]*>?/gm, '').substring(0, 200) : 
    `Apply for ${job.job_title} scholarship. Unlock educational opportunities on CareerFast.`);

  return {
    title: fullTitle,
    description: cleanDescription,
    openGraph: {
      title: fullTitle,
      description: cleanDescription,
      url: `https://careerfast.in/scholarship-details/${slug}`,
      siteName: siteName,
      images: [
        {
          url: job.company_logo || "https://careerfast.in/og-image.png",
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
      images: [job.company_logo || "https://careerfast.in/og-image.png"],
    },
    alternates: {
      canonical: `https://careerfast.in/scholarship-details/${slug}`,
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

  // Scholarship Schema (using Course/EducationalOccupationalCredential as generic) or just generic JobPosting with scholarship nuances
  const jsonLd = job ? {
    "@context": "https://schema.org/",
    "@type": "JobPosting",
    "title": job.job_title,
    "description": job.job_description,
    "identifier": {
      "@type": "PropertyValue",
      "name": "CareerFast Scholarship",
      "value": job.id
    },
    "datePosted": job.created_at,
    "hiringOrganization": {
      "@type": "Organization",
      "name": job.company_name || "CareerFast",
      "sameAs": "https://careerfast.in",
      "logo": job.company_logo
    }
  } : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <JobDetails initialData={job} serverSlug={slug} isPreview={isPreview} previewToken={previewToken} />
    </>
  );
}

