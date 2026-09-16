'use client';
import dynamic from 'next/dynamic';

const PageComponent = dynamic(() => import('@/JobPortal/Location'), { ssr: false });

export default function Page() {
  return <PageComponent />;
}
