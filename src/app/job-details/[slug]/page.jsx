import { notFound } from 'next/navigation';
import JobDetails from '@/JobPortal/JobDetails';
import { fetchJobForSEO, fetchRelatedJobsForSEO, fetchCoursesForSEO } from '@/utils/seo-fetch';
import { 
  generateNaukriJobTitle, 
  generateNaukriJobDescription, 
  formatJobLocation, 
  formatJobCompany, 
  cleanHtmlText 
} from '@/utils/seo-helper';

export async function generateMetadata({ params, searchParams }) {
  const { slug } = await params;
  const sParams = searchParams ? await searchParams : {};
  const isPreview = sParams?.preview === 'true';
  const previewToken = sParams?.preview_token || sParams?.token;
  const jobId = slug.split("-").pop();
  
  const job = await fetchJobForSEO(jobId, { preview: isPreview, preview_token: previewToken });
  
  if (!job) {
    return {
      title: "Job Not Found | CareerFast",
      description: "The requested job listing could not be found or has expired.",
      robots: { index: false, follow: false }
    };
  }

  const siteName = 'CareerFast.in';
  const fullTitle = generateNaukriJobTitle(job, siteName);
  const fullDescription = generateNaukriJobDescription(job);
  const cleanLocation = formatJobLocation(job);
  const cleanCompany = formatJobCompany(job);

  const keywords = [
    job.job_title,
    cleanCompany,
    job.job_nature,
    cleanLocation,
    `jobs in ${cleanLocation}`,
    "jobs",
    "internships",
    "careers",
    "CareerFast"
  ].filter(Boolean).join(", ");

  const canonicalUrl = `https://careerfast.in/job-details/${slug}`;

  return {
    title: fullTitle,
    description: fullDescription,
    keywords: keywords,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      title: fullTitle,
      description: fullDescription,
      url: canonicalUrl,
      siteName: 'CareerFast',
      images: [
        {
          url: job.company_logo || "https://careerfast.in/og-image.png",
          width: 800,
          height: 600,
          alt: cleanCompany,
        },
      ],
      locale: "en_US",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: fullDescription,
      images: [job.company_logo || "https://careerfast.in/og-image.png"],
    },
    alternates: {
      canonical: canonicalUrl,
    },
    other: {
      'job-id': String(job.id),
      'company': cleanCompany,
    }
  };
}

export default async function Page({ params, searchParams }) {
  const { slug } = await params;
  const sParams = searchParams ? await searchParams : {};
  const isPreview = sParams?.preview === 'true';
  const previewToken = sParams?.preview_token || sParams?.token;
  const jobId = slug.split("-").pop();
  
  // Fetch initial data on server to pass to client component in parallel
  const [job, initialRelatedJobs, initialCourses] = await Promise.all([
    fetchJobForSEO(jobId, { preview: isPreview, preview_token: previewToken }),
    fetchRelatedJobsForSEO(jobId),
    fetchCoursesForSEO(4)
  ]);

  if (!job && !isPreview) {
    notFound();
  }

  const cleanLocation = job ? formatJobLocation(job) : "India";
  const cleanCompany = job ? formatJobCompany(job) : "Company";

  const jsonLd = job ? {
    "@context": "https://schema.org/",
    "@type": "JobPosting",
    "title": job.job_title,
    "description": cleanHtmlText(job.job_description) || job.job_description,
    "identifier": {
      "@type": "PropertyValue",
      "name": cleanCompany,
      "value": String(job.id)
    },
    "datePosted": job.created_at,
    "validThrough": new Date(new Date(job.created_at).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    "employmentType": job.job_nature === "Full Time" ? "FULL_TIME" : "PART_TIME",
    "hiringOrganization": {
      "@type": "Organization",
      "name": cleanCompany,
      "sameAs": "https://careerfast.in",
      "logo": job.company_logo || "https://careerfast.in/og-image.png"
    },
    "jobLocation": {
      "@type": "Place",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": cleanLocation,
        "addressCountry": "IN"
      }
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
      <JobDetails
        initialData={job}
        initialRelatedJobs={initialRelatedJobs}
        initialCourses={initialCourses}
        serverSlug={slug}
        isPreview={isPreview}
        previewToken={previewToken}
      />
    </>
  );
}
