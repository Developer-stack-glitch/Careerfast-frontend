import JobFilter from '@/JobPortal/JobFilter';

export const metadata = {
  title: "Latest Job Openings - Find Your Dream Job",
  description: "Search and apply for the latest jobs across various industries and locations. CareerFast brings you the best career opportunities to help you succeed.",
  keywords: "jobs, job search, careers, hiring, vacancies, recruitment, CareerFast",
  alternates: { canonical: "https://careerfast.in/jobs" },
  openGraph: {
    title: "Latest Job Openings - Find Your Dream Job | CareerFast",
    description: "Search and apply for the latest jobs across industries and cities on CareerFast.",
    url: "https://careerfast.in/jobs",
    siteName: "CareerFast",
    images: ["https://careerfast.in/og-image.png"],
    type: "website",
  },
};

export default function Page() {
  return <JobFilter />;
}
