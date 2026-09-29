import { AdminTableSkeleton } from '@/Admin/AdminSkeletons';

export default function PendingJobsLoading() {
  return <AdminTableSkeleton title="Approval Pending Jobs" rowsCount={5} />;
}
