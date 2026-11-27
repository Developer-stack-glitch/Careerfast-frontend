import EventFilter from '@/JobPortal/EventFilter';

export const metadata = {
  title: "Career Events - Discover Tech Competitions & Workshops",
  description: "Browse and register for career development events, tech competitions, and professional networking opportunities on CareerFast.",
  keywords: "career events, tech events, hackathons, networking events, CareerFast",
  alternates: { canonical: "https://careerfast.in/event-filter" },
  openGraph: {
    title: "Career Events - Discover Tech Competitions & Workshops | CareerFast",
    description: "Browse and register for career events, hackathons, and tech competitions on CareerFast.",
    url: "https://careerfast.in/event-filter",
    siteName: "CareerFast",
    images: ["https://careerfast.in/og-image.png"],
    type: "website",
  },
};

export default function Page() {
  return <EventFilter />;
}
