'use client';
import dynamic from 'next/dynamic';

const Courses = dynamic(() => import('@/Courses/Courses'), {
  ssr: false,
});

export default function Page() {
  return <Courses />;
}
