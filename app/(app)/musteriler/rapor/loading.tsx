import { SkeletonRows } from '@/components/Skeleton';

export default function Loading() {
  return (
    <>
      <div className="pagehead"><h1>Bakiye raporu</h1></div>
      <div className="sk-stone" aria-hidden="true" />
      <SkeletonRows rows={8} />
    </>
  );
}
