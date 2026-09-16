'use client';
import dynamic from 'next/dynamic';

const PageComponent = dynamic(() => import('@/Footer/Footer'), { ssr: false });

export default function Page() {
  return <PageComponent />;
}
