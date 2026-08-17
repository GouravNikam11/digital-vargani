import { Skeleton } from "@/components/ui/empty";

export default function Loading() {
  return (
    <div className="space-y-3 p-4">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}
