import RecruiterPricing from '@/Pricing/RecruiterPricing';

export const metadata = {
  title: "Recruiter Pricing & Hiring Plans",
  description: "Compare CareerFast recruiter plans, job posting credits, resume search, and ATS hiring solutions for startups and enterprise teams.",
  keywords: "recruiter pricing, job posting plans, hiring plans, CareerFast HR",
  alternates: { canonical: "https://careerfast.in/recruiter-pricing" },
  openGraph: {
    title: "Recruiter Pricing & Hiring Plans | CareerFast",
    description: "Transparent hiring and job posting plans for startups, SMBs, and enterprise recruiting teams.",
    url: "https://careerfast.in/recruiter-pricing",
    siteName: "CareerFast",
    images: ["https://careerfast.in/og-image.png"],
    type: "website",
  },
};

export default function RecruiterPricingPage() {
  return <RecruiterPricing />;
}
