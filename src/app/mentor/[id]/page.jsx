'use client';
import dynamic from 'next/dynamic';

const PageComponent = dynamic(() => import('@/Mentors/MentorDetails'), { ssr: false });

export default function Page() {
  return <PageComponent />;
}
