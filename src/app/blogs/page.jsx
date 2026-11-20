'use client';
import dynamic from 'next/dynamic';

const PageComponent = dynamic(() => import('@/Blogs/Blogs'), {
  ssr: false,
  loading: () => null,
});

export default function Page() {
  return <PageComponent />;
}
