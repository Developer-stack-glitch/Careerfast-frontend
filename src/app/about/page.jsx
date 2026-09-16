'use client';
import dynamic from 'next/dynamic';

const PageComponent = dynamic(() => import('@/About/About'), { ssr: false });

export default function Page() {
  return <PageComponent />;
}
