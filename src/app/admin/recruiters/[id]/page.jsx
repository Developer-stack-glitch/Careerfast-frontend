'use client';
import React from 'react';
import { useParams } from 'next/navigation';
import RecruiterDetails from '@/Admin/RecruiterDetails';

export default function AdminRecruiterDetailsPage() {
    const params = useParams();
    const recruiterId = params?.id;

    return <RecruiterDetails recruiterId={recruiterId} />;
}
