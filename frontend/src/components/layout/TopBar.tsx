import { Link } from 'react-router-dom';
import { Phone, Clock } from 'lucide-react';

export default function TopBar() {
  return (
    <div className="bg-primary text-white text-xs">
      <div className="container-shop flex items-center justify-between h-9">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <Phone size={11} />
            <span>Hotline: 1800 123 456</span>
          </span>
          <span className="hidden sm:flex items-center gap-1.5">
            <Clock size={11} />
            <span>Thứ 2 - Thứ 7: 8:00 - 22:00 | CN: 9:00 - 21:00</span>
          </span>
        </div>
        <div className="flex items-center gap-4 text-gray-300">
          <Link to="/notifications" className="hover:text-white transition-colors">Thông báo</Link>
          <span className="hidden sm:inline">|</span>
          <Link to="/orders" className="hidden sm:inline hover:text-white transition-colors">Đơn hàng</Link>
        </div>
      </div>
    </div>
  );
}
