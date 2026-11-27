import CompetitionsLandingPage from '@/Competitions/CompetitionsLandingPage';

export const metadata = {
  title: "Coding Competitions, Hackathons & Challenges",
  description: "Participate in coding challenges, hackathons, design competitions, and case study contests hosted by top tech companies on CareerFast.",
  keywords: "competitions, hackathons, coding challenges, tech contests, CareerFast",
  alternates: { canonical: "https://www.careerfast.in/competitions" },
  openGraph: {
    title: "Coding Competitions, Hackathons & Challenges | CareerFast",
    description: "Participate in coding challenges, hackathons, and career competitions on CareerFast.",
    url: "https://www.careerfast.in/competitions",
    siteName: "CareerFast",
    images: ["https://www.careerfast.in/og-image.png"],
    type: "website",
  },
};

export default function Page() {
  return <CompetitionsLandingPage />;
}
