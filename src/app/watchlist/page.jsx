'use client';
import dynamic from 'next/dynamic';

const PageComponent = dynamic(() => import('@/Profile/WatchList'), { ssr: false });

export default function Page() {
  return <PageComponent />;
}
