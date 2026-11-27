import { notFound } from 'next/navigation';
import CourseSingle from '@/Courses/CourseSingle';
import { fetchCourseBySlugForSEO, fetchCoursesForSEO, getAbsoluteMediaUrl } from '@/utils/seo-fetch';
import { cleanHtmlText } from '@/utils/seo-helper';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const course = await fetchCourseBySlugForSEO(slug);

  if (!course) {
    return {
      title: "Course Not Found | CareerFast",
      description: "The requested online course could not be found.",
      robots: { index: false, follow: false },
    };
  }

  const title = `${course.title} - Certification Course`;
  const description = cleanHtmlText(course.description || '').substring(0, 160)
    || `Enroll in ${course.title} on CareerFast with hands-on projects and placement support.`;
  const canonicalUrl = `https://careerfast.in/courses/${slug}`;
  const imageUrl = getAbsoluteMediaUrl(course.image, 'https://careerfast.in/og-image.png');

  return {
    title,
    description,
    keywords: `${course.title}, ${course.category || 'online course'}, certification, CareerFast`,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'CareerFast',
      images: [{ url: imageUrl, alt: course.title }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function Page({ params }) {
  const { slug } = await params;
  const [course, allCourses] = await Promise.all([
    fetchCourseBySlugForSEO(slug),
    fetchCoursesForSEO(6),
  ]);

  if (!course) {
    notFound();
  }

  const relatedCourses = Array.isArray(allCourses)
    ? allCourses.filter((c) => c.slug !== slug).slice(0, 3)
    : [];

  const canonicalUrl = `https://careerfast.in/courses/${slug}`;
  const cleanDesc = cleanHtmlText(course.description || '').substring(0, 300);

  const courseJsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    "name": course.title,
    "description": cleanDesc,
    "url": canonicalUrl,
    "provider": {
      "@type": "Organization",
      "name": "CareerFast",
      "sameAs": "https://careerfast.in"
    }
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://careerfast.in/" },
      { "@type": "ListItem", "position": 2, "name": "Courses", "item": "https://careerfast.in/courses" },
      { "@type": "ListItem", "position": 3, "name": course.title, "item": canonicalUrl }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([courseJsonLd, breadcrumbJsonLd]) }}
      />
      <CourseSingle initialCourse={course} initialRelatedCourses={relatedCourses} />
    </>
  );
}
