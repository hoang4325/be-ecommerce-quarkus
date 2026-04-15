import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, Tag, ShoppingCart, Warehouse, CreditCard, ChevronLeft, Menu } from 'lucide-react';
import clsx from 'clsx';

const navItems = [
  { to: '/admin/orders', label: 'Đơn hàng', icon: ShoppingCart },
  { to: '/admin/products', label: 'Sản phẩm', icon: Package },
  { to: '/admin/categories', label: 'Danh mục', icon: Tag },
  { to: '/admin/inventory', label: 'Kho hàng', icon: Warehouse },
  { to: '/admin/payments', label: 'Thanh toán', icon: CreditCard },
];

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen flex bg-surface">
      {/* Sidebar */}
      <aside className={clsx(
        'flex flex-col bg-primary text-white transition-all duration-300 flex-shrink-0',
        collapsed ? 'w-16' : 'w-60'
      )}>
        <div className="flex items-center justify-between p-4 border-b border-gray-700 h-16">
          {!collapsed && <span className="font-black text-xl tracking-tight">VELORA</span>}
          <button onClick={() => setCollapsed(!collapsed)} className="p-1 hover:text-gray-300 transition-colors ml-auto">
            {collapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>
        <div className={clsx('px-3 py-2 text-xs text-gray-500 uppercase tracking-wider', collapsed && 'hidden')}>
          Quản trị
        </div>
        <nav className="flex-1 px-2 py-2 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => {
            const active = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors',
                  active ? 'bg-accent text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                )}
              >
                <Icon size={18} className="flex-shrink-0" />
                {!collapsed && <span>{label}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-gray-700">
          <Link to="/" className={clsx('flex items-center gap-3 px-3 py-2.5 text-sm text-gray-400 hover:text-white transition-colors')}>
            <LayoutDashboard size={18} className="flex-shrink-0" />
            {!collapsed && <span>Về trang chủ</span>}
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-border h-16 flex items-center px-6">
          <h1 className="text-lg font-semibold text-primary">
            {navItems.find(n => n.to === location.pathname)?.label ?? 'Quản trị'}
          </h1>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
