import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-primary text-gray-300 mt-20">
      <div className="container-shop py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight mb-4">VELORA</h2>
            <p className="text-sm leading-relaxed text-gray-400">
              Thời trang hiện đại, phong cách tinh tế. Mang đến những sản phẩm chất lượng cao với giá cả hợp lý.
            </p>
            <div className="flex gap-3 mt-5">
              <a href="#" className="w-9 h-9 flex items-center justify-center border border-gray-600 hover:border-white hover:text-white transition-colors text-xs font-bold">
                f
              </a>
              <a href="#" className="w-9 h-9 flex items-center justify-center border border-gray-600 hover:border-white hover:text-white transition-colors text-xs font-bold">
                ig
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-white font-semibold uppercase tracking-wider text-sm mb-5">Sản phẩm</h3>
            <ul className="space-y-3 text-sm">
              <li><Link to="/products" className="hover:text-white transition-colors">Tất cả sản phẩm</Link></li>
              <li><Link to="/products?search=áo" className="hover:text-white transition-colors">Áo</Link></li>
              <li><Link to="/products?search=quần" className="hover:text-white transition-colors">Quần</Link></li>
              <li><Link to="/products?search=phụ kiện" className="hover:text-white transition-colors">Phụ kiện</Link></li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="text-white font-semibold uppercase tracking-wider text-sm mb-5">Tài khoản</h3>
            <ul className="space-y-3 text-sm">
              <li><Link to="/login" className="hover:text-white transition-colors">Đăng nhập</Link></li>
              <li><Link to="/register" className="hover:text-white transition-colors">Đăng ký</Link></li>
              <li><Link to="/orders" className="hover:text-white transition-colors">Đơn hàng của tôi</Link></li>
              <li><Link to="/profile" className="hover:text-white transition-colors">Thông tin tài khoản</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold uppercase tracking-wider text-sm mb-5">Liên hệ</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <MapPin size={14} className="mt-0.5 flex-shrink-0" />
                <span>123 Đường Thời Trang, Q.1, TP.HCM</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={14} className="flex-shrink-0" />
                <a href="tel:1800123456" className="hover:text-white transition-colors">1800 123 456</a>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={14} className="flex-shrink-0" />
                <a href="mailto:hello@velora.vn" className="hover:text-white transition-colors">hello@velora.vn</a>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-gray-700">
        <div className="container-shop py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <span>© {new Date().getFullYear()} VELORA. All rights reserved.</span>
          <div className="flex gap-5">
            <a href="#" className="hover:text-gray-300 transition-colors">Chính sách bảo mật</a>
            <a href="#" className="hover:text-gray-300 transition-colors">Điều khoản sử dụng</a>
            <a href="#" className="hover:text-gray-300 transition-colors">Chính sách đổi trả</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
