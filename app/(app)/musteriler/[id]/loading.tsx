import { SkeletonRows } from '@/components/Skeleton';

export default function Loading() {
  return (
    <>
      <div className="sk-stone" aria-hidden="true" />
      <SkeletonRows rows={5} />
    </>
  );
}
