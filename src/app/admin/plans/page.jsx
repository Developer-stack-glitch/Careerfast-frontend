'use client';
import React from 'react';
import AdminLayout from '@/Admin/AdminLayout';
import PlansList from '@/Admin/PlansList';

export default function AdminPlansPage() {
    return (
        <AdminLayout>
            <PlansList />
        </AdminLayout>
    );
}
