import { Skeleton } from '../ui/skeleton';

interface SkeletonListProps {
  count?: number;
}

export function SkeletonList({ count = 5 }: SkeletonListProps) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="flex items-center justify-between p-4 border rounded-lg bg-card text-card-foreground shadow-sm"
        >
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <Skeleton className="h-9 w-20 rounded-md" />
        </div>
      ))}
    </div>
  );
}

export default SkeletonList;
