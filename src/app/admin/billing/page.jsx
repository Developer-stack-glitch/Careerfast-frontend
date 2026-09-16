'use client';
import React from 'react';
import AdminLayout from '@/Admin/AdminLayout';
import BillingPlan from '@/Admin/BillingPlan';

export default function BillingPlanPage() {
    return (
        <AdminLayout>
            <BillingPlan />
        </AdminLayout>
    );
}
