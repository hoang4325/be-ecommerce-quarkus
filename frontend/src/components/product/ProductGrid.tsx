import type { ReactNode } from 'react';

interface ProductGridProps {
  children: ReactNode;
  cols?: 2 | 3 | 4;
}

export default function ProductGrid({ children, cols = 4 }: ProductGridProps) {
  const colClass = {
    2: 'grid-cols-2 sm:grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
  }[cols];

  return (
    <div className={`grid ${colClass} gap-x-4 gap-y-8`}>
      {children}
    </div>
  );
}
