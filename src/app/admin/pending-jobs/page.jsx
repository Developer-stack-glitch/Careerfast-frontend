'use client';
import React from 'react';
import AdminLayout from '@/Admin/AdminLayout';
import PendingJobs from '@/Admin/PendingJobs';

export default function PendingJobsPage() {
    return (
        <AdminLayout>
            <PendingJobs />
        </AdminLayout>
    );
}
