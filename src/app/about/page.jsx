import About from '@/About/About';

export const metadata = {
  title: "About Us - Our Mission & Career Platform",
  description: "Learn about CareerFast, our mission to connect job seekers and students with verified employers, internships, scholarships, and career training across India.",
  alternates: {
    canonical: "https://www.careerfast.in/about",
  },
  openGraph: {
    title: "About CareerFast | Jobs, Internships & Career Growth",
    description: "Learn how CareerFast connects job seekers with verified employers, internships, and career resources.",
    url: "https://www.careerfast.in/about",
    siteName: "CareerFast",
    images: ["https://www.careerfast.in/og-image.png"],
    type: "website",
  },
};

export default function AboutPage() {
  return <About />;
}
