'use client';
import dynamic from 'next/dynamic';

const PageComponent = dynamic(() => import('@/Profile/BookMark'), { ssr: false });

export default function Page() {
  return <PageComponent />;
}
