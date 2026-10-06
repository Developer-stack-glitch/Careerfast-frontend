'use client';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Overview from '@/Admin/Overview';

export default function RecruitersDashboardPage() {
    const router = useRouter();
    useEffect(() => {
        router.replace('/admin/dashboard/recruiter');
    }, [router]);

    return <Overview />;
}
