import WorkshopFilter from '@/JobPortal/WorkshopFilter';

export const metadata = {
  title: "Professional Workshops - Skill Building & Hands-on Training",
  description: "Discover and register for professional development workshops, skill-building sessions, and hands-on training programs on CareerFast.",
  keywords: "workshops, professional workshops, skill development, hands-on training, CareerFast",
  alternates: { canonical: "https://www.careerfast.in/workshop-filter" },
  openGraph: {
    title: "Professional Workshops - Skill Building & Hands-on Training | CareerFast",
    description: "Discover and register for professional development workshops and hands-on training on CareerFast.",
    url: "https://www.careerfast.in/workshop-filter",
    siteName: "CareerFast",
    images: ["https://www.careerfast.in/og-image.png"],
    type: "website",
  },
};

export default function Page() {
  return <WorkshopFilter />;
}
