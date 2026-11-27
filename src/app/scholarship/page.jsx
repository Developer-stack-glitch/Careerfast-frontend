import JobFilter from '@/JobPortal/JobFilter';

export const metadata = {
  title: "Latest Scholarships for Students in India",
  description: "Explore verified scholarships, fellowships, and educational grants for students and graduates on CareerFast.",
  keywords: "scholarships, student scholarships, fellowships, education grants, CareerFast",
  alternates: { canonical: "https://careerfast.in/scholarship" },
  openGraph: {
    title: "Latest Scholarships for Students in India | CareerFast",
    description: "Explore verified scholarships, fellowships, and educational grants on CareerFast.",
    url: "https://careerfast.in/scholarship",
    siteName: "CareerFast",
    images: ["https://careerfast.in/og-image.png"],
    type: "website",
  },
};

export default function Page() {
  return <JobFilter />;
}
