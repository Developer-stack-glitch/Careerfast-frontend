'use client';
import dynamic from 'next/dynamic';

const PageComponent = dynamic(() => import('@/Register/RegisterPage'), { ssr: false });

export default function Page() {
  return <PageComponent />;
}
