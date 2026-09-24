'use client';
import React from 'react';
import AdminLayout from '@/Admin/AdminLayout';
import PlanForm from '@/Admin/PlanForm';

export default function CreatePlanPage() {
    return (
        <AdminLayout>
            <PlanForm />
        </AdminLayout>
    );
}
