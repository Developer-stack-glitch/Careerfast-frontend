'use client';
import React from 'react';
import AdminLayout from '@/Admin/AdminLayout';
import AnalyticsReport from '@/Admin/AnalyticsReport';

export default function AnalyticsPage() {
    return (
        <AdminLayout>
            <AnalyticsReport />
        </AdminLayout>
    );
}
