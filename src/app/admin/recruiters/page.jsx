'use client';
import React from 'react';
import AdminLayout from '@/Admin/AdminLayout';
import RecruitersList from '@/Admin/RecruitersList';

export default function AdminRecruitersPage() {
    return (
        <AdminLayout>
            <RecruitersList />
        </AdminLayout>
    );
}
