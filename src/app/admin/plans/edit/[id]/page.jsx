'use client';
import React from 'react';
import { useParams } from 'next/navigation';
import AdminLayout from '@/Admin/AdminLayout';
import PlanForm from '@/Admin/PlanForm';

export default function EditPlanPage() {
    const params = useParams();
    const planId = params?.id;

    return (
        <AdminLayout>
            <PlanForm planId={planId} />
        </AdminLayout>
    );
}
