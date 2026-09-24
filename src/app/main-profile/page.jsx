'use client';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const MainProfile = dynamic(() => import('@/Profile/MainProfile'), { ssr: false });
const CandidateProfileWizard = dynamic(() => import('@/ProfileWizard/CandidateProfileWizard'), { ssr: false });

export default function Page() {
  const [useNewWizard, setUseNewWizard] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // For development, we can toggle this in local storage.
    // E.g. localStorage.setItem('USE_NEW_PROFILE_WIZARD', 'true')
    const flag = localStorage.getItem('USE_NEW_PROFILE_WIZARD');
    if (flag === 'true') {
      setUseNewWizard(true);
    }
  }, []);

  // Avoid hydration mismatch by rendering nothing until mounted
  if (!mounted) return null;

  return useNewWizard ? <CandidateProfileWizard /> : <MainProfile />;
}
