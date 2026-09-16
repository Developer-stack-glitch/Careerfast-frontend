'use client';
import dynamic from 'next/dynamic';

const CourseSingle = dynamic(() => import('@/Courses/CourseSingle'), {
  ssr: false,
});

export default function Page() {
  return <CourseSingle />;
}
