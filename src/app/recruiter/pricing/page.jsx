'use client';

import dynamic from 'next/dynamic';

const RecruiterPricingComponent = dynamic(
  () => import('@/Pricing/RecruiterPricing'),
  { ssr: false }
);

export default function RecruiterPricingAliasPage() {
  return <RecruiterPricingComponent />;
}
