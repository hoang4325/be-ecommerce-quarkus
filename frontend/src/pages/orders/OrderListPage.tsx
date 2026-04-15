import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { orderApi } from '../../api/endpoints/orderApi';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import type { OrderDTO } from '../../types';
import { useState } from 'react';

export default function OrderListPage() {
  const queryClient = useQueryClient();
  const [cancelling, setCancelling] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const res = await orderApi.getOrders();
      return res.data.data as OrderDTO[];
    },
  });

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  const handleCancel = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn huỷ đơn hàng này?')) return;
    setCancelling(id);
    try {
      await orderApi.cancel(id);
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    } finally {
      setCancelling(null);
    }
  };

  const orders = data ?? [];

  if (isLoading) return <LoadingSpinner size="lg" />;

  return (
    <div className="container-shop py-12">
      <div className="mb-8">
        <p className="section-subtitle mb-1">Tài khoản</p>
        <h1 className="section-title">Đơn hàng của tôi</h1>
      </div>

      {orders.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag size={32} />}
          message="Bạn chưa có đơn hàng nào"
          action={<Link to="/products" className="btn-primary px-8 py-3 text-sm">Mua sắm ngay</Link>}
        />
      ) : (
        <div className="space-y-4">
          {orders.map((order: OrderDTO) => (
            <div key={order.id} className="bg-white border border-border p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs font-mono text-muted">#{order.id.slice(0, 8).toUpperCase()}</span>
                    <StatusBadge status={order.status} />
                  </div>
                  <p className="text-xs text-muted">
                    {new Date(order.createdAt).toLocaleDateString('vi-VN', { dateStyle: 'medium' })}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-lg font-bold text-accent">{formatPrice(order.totalAmount)}</span>
                  <Link to={`/orders/${order.id}`} className="btn-outline px-4 py-2 text-xs flex items-center gap-1.5">
                    Chi tiết <ArrowRight size={12} />
                  </Link>
                  {order.status === 'PENDING' && (
                    <button
                      onClick={() => handleCancel(order.id)}
                      disabled={cancelling === order.id}
                      className="text-xs text-accent hover:underline disabled:opacity-50"
                    >
                      {cancelling === order.id ? 'Đang huỷ...' : 'Huỷ đơn'}
                    </button>
                  )}
                </div>
              </div>
              {order.items && order.items.length > 0 && (
                <div className="border-t border-border pt-4 flex flex-wrap gap-x-6 gap-y-1">
                  {order.items.slice(0, 3).map(item => (
                    <span key={item.id} className="text-sm text-muted">
                      {item.productName} x{item.quantity}
                    </span>
                  ))}
                  {order.items.length > 3 && (
                    <span className="text-sm text-muted">+{order.items.length - 3} sản phẩm khác</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}