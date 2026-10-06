'use client';
import React from 'react';
import EmptyAdminPage from '@/Admin/EmptyAdminPage';
import { Layers } from 'lucide-react';

export default function TalentSubscriptionsPage() {
    return (
        <EmptyAdminPage
            title="Talent Subscriptions"
            module="Talent Management"
            description="Candidate membership tiers, resume spotlight packages, and candidate subscription history will be managed here."
            icon={Layers}
            badgeText="Module Coming Soon"
        />
    );
}
