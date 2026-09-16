'use client';
import dynamic from 'next/dynamic';

const PageComponent = dynamic(() => import('@/Profile/AccountSettings'), { ssr: false });

export default function Page() {
  return <PageComponent />;
}
