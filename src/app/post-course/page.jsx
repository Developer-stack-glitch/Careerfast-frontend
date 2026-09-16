'use client';
import dynamic from 'next/dynamic';

const PostCourses = dynamic(() => import('@/Courses/PostCourses'), {
  ssr: false,
});

export default function Page() {
  return <PostCourses />;
}
