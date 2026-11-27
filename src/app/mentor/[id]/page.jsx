import { notFound } from 'next/navigation';
import MentorDetails, { mentorsData } from '@/Mentors/MentorDetails';

export async function generateMetadata({ params }) {
  const { id } = await params;
  const mentor = mentorsData.find((m) => String(m.id) === String(id));

  if (!mentor) {
    return {
      title: "Mentor Not Found | CareerFast",
      robots: { index: false, follow: false },
    };
  }

  const title = `${mentor.name} - ${mentor.title} at ${mentor.company}`;
  const description = `Book a 1:1 mentorship session with ${mentor.name}, ${mentor.title} at ${mentor.company}. ${mentor.about}`;
  const canonicalUrl = `https://www.careerfast.in/mentor/${mentor.id}`;

  return {
    title,
    description: description.substring(0, 160),
    keywords: `${mentor.name}, ${mentor.title}, ${mentor.company}, mentorship, ${mentor.skills.join(', ')}, CareerFast`,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description: description.substring(0, 160),
      url: canonicalUrl,
      siteName: 'CareerFast',
      images: ['https://www.careerfast.in/og-image.png'],
      type: 'profile',
    },
  };
}

export default async function Page({ params }) {
  const { id } = await params;
  const mentor = mentorsData.find((m) => String(m.id) === String(id));

  if (!mentor) {
    notFound();
  }

  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": mentor.name,
    "jobTitle": mentor.title,
    "worksFor": { "@type": "Organization", "name": mentor.company },
    "description": mentor.about,
    "url": `https://www.careerfast.in/mentor/${mentor.id}`
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />
      <MentorDetails />
    </>
  );
}
