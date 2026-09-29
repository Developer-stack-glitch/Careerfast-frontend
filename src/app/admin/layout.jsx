'use client';
import React from 'react';
import AdminLayout from '@/Admin/AdminLayout';

export default function SuperadminRootLayout({ children }) {
    return (
        <AdminLayout>
            {children}
        </AdminLayout>
    );
}
