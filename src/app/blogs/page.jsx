'use client';
import dynamic from 'next/dynamic';
import CommonLoader from '@/Common/CommonLoader';

const PageComponent = dynamic(() => import('@/Blogs/Blogs'), {
  ssr: false,
  loading: () => <CommonLoader text="Loading Career Articles" />,
});

export default function Page() {
  return <PageComponent />;
}
