import HomePage from '@/JobPortal/HomePage';

export const metadata = {
  title: "CareerFast | Find Jobs & Internships - Your Career Growth Partner",
  description: "Discover premium job opportunities and internships with top-tier companies. Connect with 25K+ verified recruiters, explore 100K+ listings, and unlock your professional potential with CareerFast.",
  keywords: "jobs, internships, career opportunities, job search, job portal, recruitment, hiring, top companies, job listings, career growth, professional development, job seekers, employers, CareerFast",
  openGraph: {
    title: "CareerFast | Find Jobs & Internships - Your Career Growth Partner",
    description: "Discover premium job opportunities and internships with top-tier companies. Connect with 25K+ verified recruiters and explore 100K+ listings.",
    url: "https://careerfast.in/",
    siteName: "CareerFast",
    images: ["https://careerfast.in/og-image-jobs.jpg"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CareerFast | Find Jobs & Internships - Your Career Growth Partner",
    description: "Discover premium job opportunities and internships with top-tier companies. Connect with 25K+ verified recruiters and explore 100K+ listings.",
    images: ["https://careerfast.in/twitter-image-jobs.jpg"],
  },
  alternates: {
    canonical: "https://careerfast.in/",
  },
};

export default function Home() {
  return <HomePage />;
}

