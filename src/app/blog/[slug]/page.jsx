import BlogSingle from '@/Blogs/BlogSingle';
import { fetchBlogForSEO } from '@/utils/seo-fetch';
import axios from 'axios';

// Helper to generate slug consistently
const generateSlug = (text) => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

// Next.js doesn't have fetchBlogBySlug directly in API, but we can search for it
const getBlogBySlug = async (slug) => {
  try {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.careerfast.in';
    const allBlogs = await axios.get(`${apiBaseUrl}/api/blogs/all-blogs`);
    const found = allBlogs.data?.find(b => generateSlug(b.blogTitle) === slug);
    if (found) {
      const res = await axios.get(`${apiBaseUrl}/api/blogs/${found.id}`);
      return res.data;
    }
    return null;
  } catch (error) {
    return null;
  }
};

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const blog = await getBlogBySlug(slug);
  
  if (!blog) {
    return {
      title: "Blog Not Found | CareerFast",
    };
  }

  const cleanStr = (str) => {
    if (!str) return '';
    return str.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
  };

  const cleanDescription = cleanStr(blog.overview || "").substring(0, 250);

  return {
    title: `${blog.blogTitle} | CareerFast Blog`,
    description: cleanDescription,
    keywords: `blog, career tips, ${blog.blogTitle.split(' ').join(', ')}, CareerFast`,
    openGraph: {
      title: blog.blogTitle,
      description: cleanDescription,
      url: `https://careerfast.in/blog/${slug}`,
      images: [{ url: blog.blogImage }],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: blog.blogTitle,
      description: cleanDescription,
      images: [blog.blogImage],
    },
  };
}

export default async function Page({ params }) {
  const { slug } = await params;
  const blog = await getBlogBySlug(slug);

  const jsonLd = blog ? {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": blog.blogTitle,
    "description": blog.overview,
    "image": blog.blogImage,
    "author": {
      "@type": "Person",
      "name": blog.author || "CareerFast Team"
    },
    "publisher": {
      "@type": "Organization",
      "name": "CareerFast",
      "logo": {
        "@type": "ImageObject",
        "url": "https://careerfast.in/logo.png"
      }
    },
    "datePublished": blog.createdDate,
  } : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <BlogSingle initialData={blog} serverSlug={slug} />
    </>
  );
}

