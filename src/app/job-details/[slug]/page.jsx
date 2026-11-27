import { notFound } from 'next/navigation';
import JobDetails from '@/JobPortal/JobDetails';
import { fetchJobForSEO, fetchRelatedJobsForSEO, fetchCoursesForSEO, getAbsoluteMediaUrl } from '@/utils/seo-fetch';
import { getJobSlug } from '@/utils/slug';
import { 
  generateNaukriJobTitle, 
  generateNaukriJobDescription, 
  formatJobLocation, 
  formatJobCompany, 
  buildJobPostingJsonLd,
  buildJobBreadcrumbJsonLd,
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

  const canonicalSlug = getJobSlug(job) || slug;
  const canonicalUrl = `https://careerfast.in/job-details/${canonicalSlug}`;
  const logoUrl = getAbsoluteMediaUrl(job.company_logo, "https://careerfast.in/og-image.png");
  const shouldIndex = !isPreview && job.is_closed !== 1 && job.is_closed !== true;

  return {
    title: fullTitle,
    description: fullDescription,
    keywords: keywords,
    robots: {
      index: shouldIndex,
      follow: true,
      googleBot: {
        index: shouldIndex,
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
          url: logoUrl,
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
      images: [logoUrl],
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

  const canonicalSlug = (job && getJobSlug(job)) || slug;
  const canonicalUrl = `https://careerfast.in/job-details/${canonicalSlug}`;
  const jobJsonLd = buildJobPostingJsonLd(job, canonicalUrl, 'job');
  const breadcrumbJsonLd = buildJobBreadcrumbJsonLd(job, canonicalUrl, 'job');
  const structuredData = [jobJsonLd, breadcrumbJsonLd].filter(Boolean);

  return (
    <>
      {structuredData.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
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
