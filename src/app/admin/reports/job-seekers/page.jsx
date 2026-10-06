'use client';
import React from 'react';
import EmptyAdminPage from '@/Admin/EmptyAdminPage';
import { Users } from 'lucide-react';

export default function JobSeekersReportPage() {
    return (
        <EmptyAdminPage
            title="Job Seekers Reports"
            module="Report"
            description="Candidate demographics, application submission rates, job seeker search analytics, and placement metrics reports will appear here."
            icon={Users}
            badgeText="Report Coming Soon"
        />
    );
}
