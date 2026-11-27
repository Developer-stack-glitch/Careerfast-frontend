import Blogs from '@/Blogs/Blogs';
import { fetchBlogsListForSEO } from '@/utils/seo-fetch';

export const metadata = {
  title: "Career Insights, Tips & Strategies",
  description: "Stay updated with the latest career insights, job search strategies, interview tips, and professional development advice on CareerFast.",
  keywords: "career blogs, job search tips, interview preparation, career advice, resume tips, CareerFast",
  alternates: { canonical: "https://www.careerfast.in/blogs" },
  openGraph: {
    title: "Career Insights, Tips & Strategies | CareerFast",
    description: "Expert career insights, job search strategies, and interview tips from CareerFast.",
    url: "https://www.careerfast.in/blogs",
    siteName: "CareerFast",
    images: ["https://www.careerfast.in/og-image.png"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Career Insights, Tips & Strategies | CareerFast",
    description: "Expert career insights, job search strategies, and interview tips from CareerFast.",
    images: ["https://www.careerfast.in/og-image.png"],
  },
};

export default async function Page() {
  const initialBlogs = await fetchBlogsListForSEO();

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.careerfast.in/" },
      { "@type": "ListItem", "position": 2, "name": "Blogs", "item": "https://www.careerfast.in/blogs" }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Blogs initialBlogs={initialBlogs} />
    </>
  );
}
