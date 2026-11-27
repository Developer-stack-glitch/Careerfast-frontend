import HomePage from '@/JobPortal/HomePage';
import { fetchHomePageDataForSEO } from '@/utils/seo-fetch';

export const metadata = {
  title: "CareerFast | Find Jobs & Internships - Your Career Growth Partner",
  description: "Discover premium job opportunities and internships with top-tier companies. Connect with 25K+ verified recruiters, explore 100K+ listings, and unlock your professional potential with CareerFast.",
  keywords: "jobs, internships, career opportunities, job search, job portal, recruitment, hiring, top companies, job listings, career growth, professional development, job seekers, employers, CareerFast",
  openGraph: {
    title: "CareerFast | Find Jobs & Internships - Your Career Growth Partner",
    description: "Discover premium job opportunities and internships with top-tier companies. Connect with 25K+ verified recruiters and explore 100K+ listings.",
    url: "https://www.careerfast.in/",
    siteName: "CareerFast",
    images: ["https://www.careerfast.in/og-image.png"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CareerFast | Find Jobs & Internships - Your Career Growth Partner",
    description: "Discover premium job opportunities and internships with top-tier companies. Connect with 25K+ verified recruiters and explore 100K+ listings.",
    images: ["https://www.careerfast.in/og-image.png"],
  },
  alternates: {
    canonical: "https://www.careerfast.in/",
  },
};

export default async function Home() {
  const initialData = await fetchHomePageDataForSEO();
  return <HomePage initialData={initialData} />;
}
