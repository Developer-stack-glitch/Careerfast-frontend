'use client';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const PageComponent = dynamic(() => import('@/Profile/Listing'), { ssr: false });

export default function Page() {
  return (
    <Suspense fallback={null}>
      <PageComponent />
    </Suspense>
  );
}

