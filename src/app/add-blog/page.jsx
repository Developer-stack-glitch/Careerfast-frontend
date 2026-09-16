'use client';
import dynamic from 'next/dynamic';

const PageComponent = dynamic(() => import('@/Blogs/AddBlogs'), { ssr: false });

export default function Page() {
  return <PageComponent />;
}
