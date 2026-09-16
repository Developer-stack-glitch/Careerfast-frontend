'use client';
import dynamic from 'next/dynamic';

const PageComponent = dynamic(() => import('@/Blogs/Blogs'), { ssr: false });

export default function Page() {
  return <PageComponent />;
}
