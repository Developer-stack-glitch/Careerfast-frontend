'use client';
import React from 'react';
import AdminLayout from '@/Admin/AdminLayout';
import JobPost from '@/Admin/JobPost';

export default function JobPostPage() {
    return (
        <AdminLayout>
            <JobPost />
        </AdminLayout>
    );
}
