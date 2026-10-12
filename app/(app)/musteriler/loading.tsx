import { SkeletonRows } from '@/components/Skeleton';

export default function Loading() {
  return (
    <>
      <div className="pagehead"><h1>Müşteriler</h1></div>
      <SkeletonRows rows={8} />
    </>
  );
}
