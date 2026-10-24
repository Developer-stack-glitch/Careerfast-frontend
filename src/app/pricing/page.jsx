'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const RecruiterPricingComponent = dynamic(
  () => import('@/Pricing/RecruiterPricing'),
  { ssr: false }
);

export default function PricingPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/recruiter-pricing');
  }, [router]);

  return <RecruiterPricingComponent />;
}
