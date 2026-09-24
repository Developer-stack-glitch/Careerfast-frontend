'use client';
import React from 'react';
import { useParams } from 'next/navigation';
import AdminLayout from '@/Admin/AdminLayout';
import PlanSubscribers from '@/Admin/PlanSubscribers';

export default function SinglePlanSubscribersPage() {
    const params = useParams();
    const planId = params?.id;

    return (
        <AdminLayout>
            <PlanSubscribers planId={planId} />
        </AdminLayout>
    );
}
