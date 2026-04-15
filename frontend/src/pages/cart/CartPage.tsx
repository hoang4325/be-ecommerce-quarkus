import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { cartApi } from '../../api/endpoints/cartApi';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import type { CartItemDTO } from '../../types';
import { useState } from 'react';

export default function CartPage() {
  const queryClient = useQueryClient();
  const [loadingItem, setLoadingItem] = useState<string | null>(null);

  const { data: cartData, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const res = await cartApi.getCart();
      return res.data.data;
    },
  });

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  const updateQuantity = async (item: CartItemDTO, newQty: number) => {
    if (newQty < 1) return;
    setLoadingItem(item.id);
    try {
      await cartApi.updateItem(item.id, { quantity: newQty });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    } finally {
      setLoadingItem(null);
    }
  };

  const removeItem = async (itemId: string) => {
    setLoadingItem(itemId);
    try {
      await cartApi.removeItem(itemId);
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    } finally {
      setLoadingItem(null);
    }
  };

  const clearCart = async () => {
    await cartApi.clearCart();
    queryClient.invalidateQueries({ queryKey: ['cart'] });
  };

  if (isLoading) return <LoadingSpinner size="lg" />;

  const items = cartData?.items ?? [];
  const total = cartData?.totalAmount ?? 0;

  return (
    <div className="container-shop py-12">
      <div className="mb-8">
        <p className="section-subtitle mb-1">Mua sắm</p>
        <h1 className="section-title">Giỏ hàng của bạn</h1>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag size={32} />}
          message="Giỏ hàng của bạn đang trống"
          action={<Link to="/products" className="btn-primary px-8 py-3 text-sm">Tiếp tục mua sắm</Link>}
        />
      ) : (
        <div className="grid lg:grid-cols-3 gap-10">
          {/* Cart items */}
          <div className="lg:col-span-2 space-y-0">
            <div className="hidden md:grid grid-cols-12 pb-4 border-b border-border text-xs uppercase tracking-widest font-semibold text-muted">
              <span className="col-span-6">Sản phẩm</span>
              <span className="col-span-2 text-center">Đơn giá</span>
              <span className="col-span-2 text-center">Số lượng</span>
              <span className="col-span-2 text-right">Thành tiền</span>
            </div>
            {items.map((item: CartItemDTO) => (
              <div key={item.id} className="py-6 border-b border-border grid grid-cols-12 gap-4 items-center">
                <div className="col-span-12 md:col-span-6 flex gap-4 items-center">
                  <div className="w-16 h-20 bg-surface flex-shrink-0 flex items-center justify-center">
                    <ShoppingBag size={24} className="text-gray-300" />
                  </div>
                  <div>
                    <Link to={`/products/${item.productId}`} className="text-sm font-semibold hover:text-accent transition-colors">
                      {item.productName}
                    </Link>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="flex items-center gap-1 text-xs text-muted hover:text-accent mt-1 transition-colors"
                    >
                      <Trash2 size={11} /> Xóa
                    </button>
                  </div>
                </div>
                <div className="col-span-4 md:col-span-2 text-center text-sm">{formatPrice(item.price)}</div>
                <div className="col-span-4 md:col-span-2 flex items-center justify-center">
                  <div className="flex items-center border border-border">
                    <button
                      onClick={() => updateQuantity(item, item.quantity - 1)}
                      disabled={loadingItem === item.id}
                      className="w-8 h-8 flex items-center justify-center hover:bg-surface disabled:opacity-40"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="w-8 h-8 flex items-center justify-center text-sm border-x border-border font-medium">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item, item.quantity + 1)}
                      disabled={loadingItem === item.id}
                      className="w-8 h-8 flex items-center justify-center hover:bg-surface disabled:opacity-40"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
                <div className="col-span-4 md:col-span-2 text-right font-bold text-primary text-sm">
                  {formatPrice(item.subtotal)}
                </div>
              </div>
            ))}
            <div className="pt-4 flex gap-3">
              <button onClick={clearCart} className="text-xs text-muted hover:text-accent transition-colors underline">
                Xóa toàn bộ giỏ hàng
              </button>
            </div>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="bg-surface p-6 sticky top-24">
              <h2 className="text-sm font-bold uppercase tracking-widest mb-6">Tóm tắt đơn hàng</h2>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">Tạm tính ({cartData?.itemCount ?? 0} sản phẩm)</span>
                  <span>{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Vận chuyển</span>
                  <span className="text-green-600 font-medium">Tính khi thanh toán</span>
                </div>
                <div className="border-t border-border pt-4 flex justify-between font-bold text-base">
                  <span>Tổng cộng</span>
                  <span className="text-accent text-lg">{formatPrice(total)}</span>
                </div>
              </div>
              <Link
                to="/checkout"
                className="btn-accent w-full mt-6 py-4 text-sm flex items-center justify-center gap-2"
              >
                Tiến hành thanh toán <ArrowRight size={16} />
              </Link>
              <Link to="/products" className="btn-ghost w-full mt-3 text-center text-sm py-2">
                Tiếp tục mua sắm
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}