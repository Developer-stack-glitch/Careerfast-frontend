'use client';
import dynamic from 'next/dynamic';

const CandidateProfileWizard = dynamic(() => import('@/ProfileWizard/CandidateProfileWizard'), { ssr: false });

export default function Page() {
  return <CandidateProfileWizard />;
}
