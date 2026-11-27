import LandingPage from '@/InternshipPortal/LandingPage';

export const metadata = {
  title: "Latest Internships - Kickstart Your Career",
  description: "Find the best internships for students and freshers. Apply to top companies and gain valuable experience with CareerFast.",
  keywords: "internships, student jobs, fresher jobs, career, internships in India, CareerFast",
  alternates: { canonical: "https://careerfast.in/internships" },
  openGraph: {
    title: "Latest Internships - Kickstart Your Career | CareerFast",
    description: "Find verified paid and remote internships for students and freshers across India.",
    url: "https://careerfast.in/internships",
    siteName: "CareerFast",
    images: ["https://careerfast.in/og-image.png"],
    type: "website",
  },
};

export default function Page() {
  return <LandingPage />;
}
