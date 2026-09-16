import JobDetails from '@/JobPortal/JobDetails';
import { fetchJobForSEO } from '@/utils/seo-fetch';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const jobId = slug.split("-").pop();
  
  const job = await fetchJobForSEO(jobId);
  
  if (!job) {
    return {
      title: "Job Not Found | CareerFast",
      description: "The requested job listing could not be found."
    };
  }

  const siteName = 'CareerFast';
  
  const location = (() => {
    let locStr = "";
    if (job.work_location) {
      try {
        const parsed = JSON.parse(job.work_location);
        locStr = Array.isArray(parsed) ? parsed.join(", ") : job.work_location;
      } catch {
        locStr = job.work_location;
      }
    }
    return `${job.workplace_type || ""}${locStr ? ` • ${locStr}` : ""}`.trim();
  })();

  const experience = Array.isArray(job.experience_required) 
    ? job.experience_required.join(", ") 
    : (job.experience_required || "");

  const fullTitle = `${job.job_title} - ${location} - ${job.company_name} - ${experience}`;
  
  // Clean description helper
  const cleanStr = (str) => {
    if (!str) return '';
    return str.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
  };

  const baseDescription = job.seo_description || (job.job_description ? 
    cleanStr(job.job_description).substring(0, 200) : 
    `Apply for ${job.job_title} at ${job.company_name}.`);

  const fullDescription = `${baseDescription} - ${location} - ${experience}`;
  
  const keywords = [
    job.job_title,
    job.company_name,
    job.job_nature,
    job.workplace_type,
    "jobs",
    "internships",
    "career",
    "CareerFast"
  ].filter(Boolean).join(", ");

  return {
    title: fullTitle,
    description: fullDescription,
    keywords: keywords,
    openGraph: {
      title: fullTitle,
      description: fullDescription,
      url: `https://careerfast.in/job-details/${slug}`,
      siteName: siteName,
      images: [
        {
          url: job.company_logo || "https://careerfast.in/og-image.png",
          width: 800,
          height: 600,
          alt: job.company_name,
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
      canonical: `https://careerfast.in/job-details/${slug}`,
    },
    other: {
      'job-id': job.id,
      'company': job.company_name,
    }
  };
}

export default async function Page({ params }) {
  const { slug } = await params;
  const jobId = slug.split("-").pop();
  
  // Fetch initial data on server to pass to client component
  const job = await fetchJobForSEO(jobId);

  const jsonLd = job ? {
    "@context": "https://schema.org/",
    "@type": "JobPosting",
    "title": job.job_title,
    "description": job.job_description,
    "identifier": {
      "@type": "PropertyValue",
      "name": job.company_name,
      "value": job.id
    },
    "datePosted": job.created_at,
    "validThrough": new Date(new Date(job.created_at).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    "employmentType": job.job_nature === "Full Time" ? "FULL_TIME" : "PART_TIME",
    "hiringOrganization": {
      "@type": "Organization",
      "name": job.company_name,
      "sameAs": "https://careerfast.in",
      "logo": job.company_logo
    },
    "jobLocation": {
      "@type": "Place",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": job.work_location,
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
      <JobDetails initialData={job} serverSlug={slug} />
    </>
  );
}


