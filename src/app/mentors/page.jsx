import MentorList from '@/Mentors/MentorList';

export const metadata = {
  title: "Expert Mentorship - Career Guidance & Interview Prep",
  description: "Book 1:1 mentorship sessions with industry leaders from top companies. Get expert guidance on interview prep, career growth, and skill building.",
  keywords: "mentorship, career mentors, industry experts, 1:1 sessions, interview preparation, CareerFast",
  alternates: { canonical: "https://www.careerfast.in/mentors" },
  openGraph: {
    title: "Expert Mentorship - Career Guidance & Interview Prep | CareerFast",
    description: "Book 1:1 mentorship sessions with industry leaders from top companies.",
    url: "https://www.careerfast.in/mentors",
    siteName: "CareerFast",
    images: ["https://www.careerfast.in/og-image.png"],
    type: "website",
  },
};

export default function Page() {
  return <MentorList />;
}
