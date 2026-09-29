'use client';
import React from 'react';
import { useParams } from 'next/navigation';
import PlanSubscribers from '@/Admin/PlanSubscribers';

export default function AdminPlanSubscribersByIdPage() {
    const params = useParams();
    const planId = params?.id;

    return <PlanSubscribers planId={planId} />;
}
