'use client';
import dynamic from 'next/dynamic';

const PageComponent = dynamic(() => import('@/PostWorkShop/PostWorkShop'), { ssr: false });

export default function Page() {
  return <PageComponent />;
}
