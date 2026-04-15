import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MapPin, ShoppingBag } from 'lucide-react';
import { cartApi } from '../../api/endpoints/cartApi';
import { orderApi } from '../../api/endpoints/orderApi';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import type { CartItemDTO } from '../../types';

export default function CheckoutPage() {
  const [shippingAddress, setShippingAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: cartData, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const res = await cartApi.getCart();
      return res.data.data;
    },
  });

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shippingAddress.trim()) {
      setError('Vui lòng nhập địa chỉ giao hàng');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await orderApi.create({ shippingAddress: shippingAddress.trim() });
      const orderId = res.data.data?.id;
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      navigate(orderId ? `/orders/${orderId}` : '/orders');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message ?? 'Đặt hàng thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) return <LoadingSpinner size="lg" />;

  const items = cartData?.items ?? [];
  const total = cartData?.totalAmount ?? 0;

  if (items.length === 0) {
    return (
      <div className="container-shop py-20">
        <EmptyState
          icon={<ShoppingBag size={32} />}
          message="Giỏ hàng của bạn đang trống"
          action={<Link to="/products" className="btn-primary px-8 py-3 text-sm">Tiếp tục mua sắm</Link>}
        />
      </div>
    );
  }

  return (
    <div className="container-shop py-12">
      <div className="mb-8">
        <p className="section-subtitle mb-1">Mua sắm</p>
        <h1 className="section-title">Thanh toán</h1>
      </div>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Form */}
        <div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-widest mb-5 pb-3 border-b border-border">
                Thông tin giao hàng
              </h2>
              <label className="block mb-2 text-sm font-medium text-primary">
                <MapPin size={14} className="inline mr-1.5 mb-0.5" />
                Địa chỉ giao hàng <span className="text-accent">*</span>
              </label>
              <textarea
                value={shippingAddress}
                onChange={e => setShippingAddress(e.target.value)}
                rows={4}
                placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố..."
                className="input resize-none"
                required
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="bg-surface p-4 text-sm text-gray-600">
              <p className="font-medium text-primary mb-1">Lưu ý về đơn hàng</p>
              <ul className="list-disc list-inside space-y-1 text-xs text-muted">
                <li>Đơn hàng sẽ được xác nhận tự động sau khi đặt thành công</li>
                <li>Thanh toán sẽ được xử lý qua hệ thống của chúng tôi</li>
                <li>Bạn có thể theo dõi đơn hàng trong mục "Đơn hàng của tôi"</li>
              </ul>
            </div>

            <button type="submit" disabled={submitting} className="btn-accent w-full py-4 text-sm">
              {submitting ? 'Đang đặt hàng...' : 'Đặt hàng ngay'}
            </button>
          </form>
        </div>

        {/* Order summary */}
        <div>
          <h2 className="text-sm font-bold uppercase tracking-widest mb-5 pb-3 border-b border-border">
            Đơn hàng của bạn ({cartData?.itemCount ?? 0} sản phẩm)
          </h2>
          <div className="divide-y divide-border">
            {items.map((item: CartItemDTO) => (
              <div key={item.id} className="flex items-center justify-between py-4 gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-18 bg-surface flex-shrink-0 flex items-center justify-center">
                    <ShoppingBag size={20} className="text-gray-300" />
                  </div>
                  <div>
                    <p className="text-sm font-medium leading-tight">{item.productName}</p>
                    <p className="text-xs text-muted mt-0.5">x {item.quantity}</p>
                  </div>
                </div>
                <span className="text-sm font-semibold flex-shrink-0">{formatPrice(item.subtotal)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-border pt-4 mt-2 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted">Tạm tính</span>
              <span>{formatPrice(total)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Phí vận chuyển</span>
              <span className="text-green-600">Miễn phí</span>
            </div>
            <div className="flex justify-between font-bold text-base pt-2 border-t border-border">
              <span>Tổng cộng</span>
              <span className="text-accent text-lg">{formatPrice(total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}