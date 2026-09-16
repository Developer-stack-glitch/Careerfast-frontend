'use client';
import dynamic from 'next/dynamic';

const PageComponent = dynamic(() => import('@/JobPortal/EventFilter'), { ssr: false });

export default function Page() {
  return <PageComponent />;
}
