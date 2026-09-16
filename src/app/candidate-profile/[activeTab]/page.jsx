'use client';
import dynamic from 'next/dynamic';

const PageComponent = dynamic(() => import('@/Profile/AdminProfile'), { ssr: false });

export default function Page() {
  return <PageComponent />;
}
