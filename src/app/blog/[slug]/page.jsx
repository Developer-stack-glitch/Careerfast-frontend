import { notFound } from 'next/navigation';
import BlogSingle from '@/Blogs/BlogSingle';
import { fetchBlogBySlugForSEO, getAbsoluteMediaUrl } from '@/utils/seo-fetch';
import { cleanHtmlText } from '@/utils/seo-helper';

function getBlogOgImage(blog) {
  if (!blog) return 'https://careerfast.in/og-image.png';
  if (blog.blogImage && typeof blog.blogImage === 'string') {
    if (blog.blogImage.startsWith('data:')) {
      return `https://careerfast.in/api/blogs/image/${blog.id}`;
    }
    return getAbsoluteMediaUrl(blog.blogImage, 'https://careerfast.in/og-image.png');
  }
  return 'https://careerfast.in/og-image.png';
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const blog = await fetchBlogBySlugForSEO(slug);

  if (!blog) {
    return {
      title: "Blog Not Found | CareerFast",
      description: "The requested career article could not be found.",
      robots: { index: false, follow: false },
    };
  }

  const cleanDescription = cleanHtmlText(blog.overview || blog.blogDescription || '').substring(0, 160)
    || `Read ${blog.blogTitle} on CareerFast Blog.`;
  const canonicalUrl = `https://careerfast.in/blog/${slug}`;
  const imageUrl = getBlogOgImage(blog);

  return {
    title: `${blog.blogTitle} | CareerFast Blog`,
    description: cleanDescription,
    keywords: `blog, career tips, ${blog.blogTitle.split(' ').join(', ')}, CareerFast`,
    robots: { index: true, follow: true },
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: blog.blogTitle,
      description: cleanDescription,
      url: canonicalUrl,
      siteName: 'CareerFast',
      images: [{ url: imageUrl, alt: blog.blogTitle }],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: blog.blogTitle,
      description: cleanDescription,
      images: [imageUrl],
    },
  };
}

export default async function Page({ params }) {
  const { slug } = await params;
  const blog = await fetchBlogBySlugForSEO(slug);

  if (!blog) {
    notFound();
  }

  const canonicalUrl = `https://careerfast.in/blog/${slug}`;
  const imageUrl = getBlogOgImage(blog);
  const cleanDescription = cleanHtmlText(blog.overview || blog.blogDescription || '').substring(0, 250);

  const blogJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": blog.blogTitle,
    "description": cleanDescription,
    "image": imageUrl,
    "author": {
      "@type": "Person",
      "name": blog.author || "CareerFast Team"
    },
    "publisher": {
      "@type": "Organization",
      "name": "CareerFast",
      "logo": {
        "@type": "ImageObject",
        "url": "https://careerfast.in/og-image.png"
      }
    },
    "datePublished": blog.createdDate,
    ...(blog.updatedDate ? { "dateModified": blog.updatedDate } : {}),
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": canonicalUrl
    }
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://careerfast.in/" },
      { "@type": "ListItem", "position": 2, "name": "Blogs", "item": "https://careerfast.in/blogs" },
      { "@type": "ListItem", "position": 3, "name": blog.blogTitle, "item": canonicalUrl }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([blogJsonLd, breadcrumbJsonLd]) }}
      />
      <BlogSingle initialData={blog} serverSlug={slug} />
    </>
  );
}
