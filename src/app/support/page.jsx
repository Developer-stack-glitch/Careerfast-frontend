'use client';
import dynamic from 'next/dynamic';

const SupportPageComponent = dynamic(() => import('@/Support/SupportPage'), { ssr: false });

export default function SupportPage() {
  return <SupportPageComponent />;
}
