'use client';
import dynamic from 'next/dynamic';

const PageComponent = dynamic(() => import('@/JobPortal/JobFilter'), { ssr: false });

export default function Page() {
  return <PageComponent />;
}
