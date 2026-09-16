'use client';
import dynamic from 'next/dynamic';

const PageComponent = dynamic(() => import('@/InternshipPortal/LandingPage'), { ssr: false });

export default function Page() {
  return <PageComponent />;
}
