'use client';
import dynamic from 'next/dynamic';

const PageComponent = dynamic(() => import('@/Login/Login'), { ssr: false });

export default function Page() {
  return <PageComponent />;
}
