import type { ReactNode } from 'react';
import { Package } from 'lucide-react';

interface EmptyStateProps {
  message?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export default function EmptyState({ message = 'Không có dữ liệu', icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center mb-4 text-muted">
        {icon ?? <Package size={28} />}
      </div>
      <p className="text-muted text-sm font-medium">{message}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
