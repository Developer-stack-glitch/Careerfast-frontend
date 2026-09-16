'use client';
import React from 'react';
import AdminLayout from '@/Admin/AdminLayout';
import JobSeekers from '@/Admin/JobSeekers';

export default function JobSeekersPage() {
    return (
        <AdminLayout>
            <JobSeekers />
        </AdminLayout>
    );
}
