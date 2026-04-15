import type { OrderStatus } from '../../types';

interface StatusBadgeProps {
  status: OrderStatus | string;
}

const STATUS_MAP: Record<string, { label: string; class: string }> = {
  PENDING: { label: 'Chờ xử lý', class: 'status-pending' },
  STOCK_RESERVED: { label: 'Đã giữ hàng', class: 'status-reserved' },
  CONFIRMED: { label: 'Đã xác nhận', class: 'status-confirmed' },
  CANCELLED: { label: 'Đã huỷ', class: 'status-cancelled' },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_MAP[status] ?? { label: status, class: 'badge-neutral' };
  return <span className={config.class}>{config.label}</span>;
}
