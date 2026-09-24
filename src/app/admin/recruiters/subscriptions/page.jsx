'use client';
import React from 'react';
import AdminLayout from '@/Admin/AdminLayout';
import RecruiterSubscriptions from '@/Admin/RecruiterSubscriptions';

export default function AdminRecruiterSubscriptionsPage() {
    return (
        <AdminLayout>
            <RecruiterSubscriptions />
        </AdminLayout>
    );
}
