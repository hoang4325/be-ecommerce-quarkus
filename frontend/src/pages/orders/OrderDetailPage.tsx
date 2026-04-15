import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronRight, ShoppingBag, MapPin } from 'lucide-react';
import { orderApi } from '../../api/endpoints/orderApi';
import { paymentApi } from '../../api/endpoints/paymentApi';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { useState } from 'react';

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [cancelling, setCancelling] = useState(false);

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const res = await orderApi.getById(id!);
      return res.data.data!;
    },
    enabled: !!id,
  });

  const { data: payment } = useQuery({
    queryKey: ['payment-order', id],
    queryFn: async () => {
      const res = await paymentApi.getByOrder(id!);
      return res.data.data;
    },
    enabled: !!id,
  });

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  const handleCancel = async () => {
    if (!order || !confirm('Bạn có chắc chắn muốn huỷ đơn hàng này?')) return;
    setCancelling(true);
    try {
      await orderApi.cancel(order.id);
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    } finally {
      setCancelling(false);
    }
  };

  if (isLoading) return <LoadingSpinner size="lg" />;
  if (!order) return (
    <div className="container-shop py-20 text-center">
      <p className="text-muted">Không tìm thấy đơn hàng</p>
      <Link to="/orders" className="btn-outline mt-6 px-6 py-2.5 text-sm inline-flex">Quay lại</Link>
    </div>
  );

  return (
    <div className="container-shop py-12">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted mb-8">
        <Link to="/orders" className="hover:text-primary">Đơn hàng của tôi</Link>
        <ChevronRight size={14} />
        <span className="text-primary font-medium">#{order.id.slice(0, 8).toUpperCase()}</span>
      </nav>

      <div className="grid lg:grid-cols-3 gap-10">
        {/* Items */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-xl font-bold">Đơn hàng #{order.id.slice(0, 8).toUpperCase()}</h1>
                <StatusBadge status={order.status} />
              </div>
              <p className="text-sm text-muted">
                Đặt ngày {new Date(order.createdAt).toLocaleDateString('vi-VN', { dateStyle: 'long' })}
              </p>
            </div>
            {order.status === 'PENDING' && (
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="btn-outline-accent px-4 py-2 text-xs"
              >
                {cancelling ? 'Đang huỷ...' : 'Huỷ đơn hàng'}
              </button>
            )}
          </div>

          <div className="border border-border">
            <div className="px-6 py-4 border-b border-border bg-surface">
              <h2 className="text-xs font-bold uppercase tracking-widest">Sản phẩm đặt mua</h2>
            </div>
            <div className="divide-y divide-border">
              {order.items?.map(item => (
                <div key={item.id} className="flex items-center gap-4 px-6 py-4">
                  <div className="w-14 h-14 bg-surface flex-shrink-0 flex items-center justify-center">
                    <ShoppingBag size={20} className="text-gray-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link to={`/products/${item.productId}`} className="text-sm font-medium hover:text-accent transition-colors">
                      {item.productName}
                    </Link>
                    <p className="text-xs text-muted mt-0.5">x {item.quantity} × {formatPrice(item.price)}</p>
                  </div>
                  <span className="font-semibold text-sm flex-shrink-0">{formatPrice(item.subtotal)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Payment info */}
          {payment && (
            <div className="border border-border">
              <div className="px-6 py-4 border-b border-border bg-surface">
                <h2 className="text-xs font-bold uppercase tracking-widest">Thông tin thanh toán</h2>
              </div>
              <div className="px-6 py-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">Trạng thái</span>
                  <span className={`font-semibold ${payment.status === 'SUCCESS' ? 'text-green-600' : 'text-red-600'}`}>
                    {payment.status === 'SUCCESS' ? 'Thành công' : 'Thất bại'}
                  </span>
                </div>
                {payment.transactionId && (
                  <div className="flex justify-between">
                    <span className="text-muted">Mã giao dịch</span>
                    <span className="font-mono text-xs">{payment.transactionId}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted">Số tiền</span>
                  <span className="font-bold text-accent">{formatPrice(payment.amount)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar summary */}
        <div className="space-y-6">
          <div className="border border-border">
            <div className="px-6 py-4 border-b border-border bg-surface">
              <h2 className="text-xs font-bold uppercase tracking-widest">Tóm tắt</h2>
            </div>
            <div className="px-6 py-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Tạm tính</span>
                <span>{formatPrice(order.totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Vận chuyển</span>
                <span className="text-green-600">Miễn phí</span>
              </div>
              <div className="flex justify-between font-bold text-base pt-2 border-t border-border">
                <span>Tổng cộng</span>
                <span className="text-accent">{formatPrice(order.totalAmount)}</span>
              </div>
            </div>
          </div>

          <div className="border border-border">
            <div className="px-6 py-4 border-b border-border bg-surface">
              <h2 className="text-xs font-bold uppercase tracking-widest">Địa chỉ giao hàng</h2>
            </div>
            <div className="px-6 py-4">
              <div className="flex items-start gap-2 text-sm">
                <MapPin size={14} className="text-muted mt-0.5 flex-shrink-0" />
                <span className="text-gray-600">{order.shippingAddress}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}