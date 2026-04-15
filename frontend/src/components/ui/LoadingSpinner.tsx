export default function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' }[size];
  return (
    <div className="flex items-center justify-center py-12">
      <div className={`${sizeClass} border-2 border-border border-t-primary rounded-full animate-spin`} />
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[3/4] bg-gray-200 mb-3" />
      <div className="h-3 bg-gray-200 rounded mb-2 w-1/3" />
      <div className="h-4 bg-gray-200 rounded mb-2" />
      <div className="h-4 bg-gray-200 rounded w-2/3" />
      <div className="h-5 bg-gray-200 rounded mt-3 w-1/2" />
    </div>
  );
}
