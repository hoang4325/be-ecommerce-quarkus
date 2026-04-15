import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Eye } from 'lucide-react';
import type { ProductDTO } from '../../types';
import { cartApi } from '../../api/endpoints/cartApi';
import { useAuthStore } from '../../auth/authStore';
import { useQueryClient } from '@tanstack/react-query';

interface ProductCardProps {
  product: ProductDTO;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [adding, setAdding] = useState(false);
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated()) return;
    setAdding(true);
    try {
      await cartApi.addItem({ productId: product.id, quantity: 1 });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    } catch {
      // silently fail – user will see error on product detail
    } finally {
      setAdding(false);
    }
  };

  const formattedPrice = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price);

  return (
    <div className="group relative bg-white">
      {/* Image */}
      <Link to={`/products/${product.id}`} className="block relative overflow-hidden aspect-[3/4] bg-surface">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <ShoppingBag size={40} className="text-gray-300" />
          </div>
        )}

        {/* Overlay actions */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 flex items-end justify-center gap-2 p-3 opacity-0 group-hover:opacity-100">
          {isAuthenticated() && (
            <button
              onClick={handleAddToCart}
              disabled={adding}
              className="flex-1 bg-white text-primary text-xs font-semibold uppercase tracking-wide py-2.5 hover:bg-primary hover:text-white transition-colors duration-200 flex items-center justify-center gap-1.5"
            >
              <ShoppingBag size={14} />
              {adding ? 'Đang thêm...' : 'Thêm vào giỏ'}
            </button>
          )}
          <Link
            to={`/products/${product.id}`}
            className="bg-white p-2.5 hover:bg-primary hover:text-white transition-colors duration-200"
          >
            <Eye size={14} />
          </Link>
        </div>
      </Link>

      {/* Info */}
      <div className="pt-3 pb-1">
        {product.categoryName && (
          <p className="text-[11px] text-muted uppercase tracking-widest mb-1">{product.categoryName}</p>
        )}
        <Link to={`/products/${product.id}`} className="block">
          <h3 className="text-sm font-medium text-primary leading-snug hover:text-accent transition-colors line-clamp-2">
            {product.name}
          </h3>
        </Link>
        <p className="text-price mt-1.5 text-base font-bold">{formattedPrice}</p>
      </div>
    </div>
  );
}
