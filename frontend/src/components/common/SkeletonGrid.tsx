import { Skeleton } from '../ui/skeleton';
import { Card, CardContent, CardFooter, CardHeader } from '../ui/card';

interface SkeletonGridProps {
  count?: number;
}

export function SkeletonGrid({ count = 6 }: SkeletonGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="overflow-hidden">
          <CardHeader className="space-y-2">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
          <CardFooter className="flex justify-between items-center pt-4 border-t">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-9 w-24 rounded-md" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

export default SkeletonGrid;
