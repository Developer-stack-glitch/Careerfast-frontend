'use client';
import dynamic from 'next/dynamic';
import CommonLoader from '@/Common/CommonLoader';

const CourseSingle = dynamic(() => import('@/Courses/CourseSingle'), {
  ssr: false,
  loading: () => <CommonLoader text="Loading Course Details" />,
});

export default function Page() {
  return <CourseSingle />;
}
