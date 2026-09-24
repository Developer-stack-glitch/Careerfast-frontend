'use client';
import React from 'react';
import AdminLayout from '@/Admin/AdminLayout';
import PlanSubscribers from '@/Admin/PlanSubscribers';

export default function PlanSubscribersPage() {
    return (
        <AdminLayout>
            <PlanSubscribers />
        </AdminLayout>
    );
}
