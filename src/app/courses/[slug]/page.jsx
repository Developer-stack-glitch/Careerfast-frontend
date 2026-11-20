'use client';
import dynamic from 'next/dynamic';

const CourseSingle = dynamic(() => import('@/Courses/CourseSingle'), {
  ssr: false,
  loading: () => null,
});

export default function Page() {
  return <CourseSingle />;
}
