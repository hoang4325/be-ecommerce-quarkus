import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, User, ShoppingBag, Menu, X, ChevronDown, Bell } from 'lucide-react';
import { useAuthStore } from '../../auth/authStore';
import { authService } from '../../auth/authService';
import { useQuery } from '@tanstack/react-query';
import { cartApi } from '../../api/endpoints/cartApi';
import { categoryApi } from '../../api/endpoints/productApi';
import type { CategoryDTO } from '../../types';
import clsx from 'clsx';

export default function Header() {
  const [search, setSearch] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin, logout } = useAuthStore();
  const userMenuRef = useRef<HTMLDivElement>(null);

  const { data: cartData } = useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const res = await cartApi.getCart();
      return res.data.data;
    },
    enabled: isAuthenticated(),
    staleTime: 30000,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await categoryApi.list();
      return res.data.data as CategoryDTO[];
    },
    staleTime: 300000,
  });

  const categories = categoriesData ?? [];
  const cartCount = cartData?.itemCount ?? 0;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/products?search=${encodeURIComponent(search.trim())}`);
      setSearch('');
    }
  };

  const handleLogout = () => {
    logout();
    authService.logout();
    navigate('/login');
    setUserMenuOpen(false);
  };

  // Close user menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="bg-white border-b border-border sticky top-0 z-40 shadow-sm">
      <div className="container-shop">
        <div className="flex items-center h-16 gap-4">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0 font-black text-2xl tracking-tight text-primary">
            VELORA
          </Link>

          {/* Search — desktop */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm kiếm sản phẩm..."
                className="w-full border border-border pl-4 pr-10 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary">
                <Search size={16} />
              </button>
            </div>
          </form>

          {/* Right icons */}
          <div className="flex items-center gap-1 ml-auto">
            {/* Notifications */}
            {isAuthenticated() && (
              <Link to="/notifications" className="p-2 hover:text-accent transition-colors relative">
                <Bell size={20} />
              </Link>
            )}

            {/* User menu */}
            {isAuthenticated() ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-1 p-2 hover:text-accent transition-colors"
                >
                  <User size={20} />
                  <span className="hidden lg:inline text-sm font-medium">{user?.firstName}</span>
                  <ChevronDown size={14} className="hidden lg:inline" />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-52 bg-white shadow-lg border border-border z-50 animate-fade-in">
                    <div className="px-4 py-3 border-b border-border">
                      <p className="text-sm font-semibold">{user?.firstName} {user?.lastName}</p>
                      <p className="text-xs text-muted">{user?.email}</p>
                    </div>
                    <Link to="/profile" onClick={() => setUserMenuOpen(false)} className="block px-4 py-2.5 text-sm hover:bg-surface transition-colors">Tài khoản của tôi</Link>
                    <Link to="/orders" onClick={() => setUserMenuOpen(false)} className="block px-4 py-2.5 text-sm hover:bg-surface transition-colors">Đơn hàng</Link>
                    {isAdmin() && (
                      <>
                        <div className="border-t border-border" />
                        <Link to="/admin/products" onClick={() => setUserMenuOpen(false)} className="block px-4 py-2.5 text-sm text-accent hover:bg-surface transition-colors">Quản trị</Link>
                      </>
                    )}
                    <div className="border-t border-border" />
                    <button onClick={handleLogout} className="block w-full text-left px-4 py-2.5 text-sm hover:bg-surface transition-colors">Đăng xuất</button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="flex items-center gap-1 p-2 hover:text-accent transition-colors">
                <User size={20} />
                <span className="hidden lg:inline text-sm">Đăng nhập</span>
              </Link>
            )}

            {/* Cart */}
            <Link to="/cart" className="relative p-2 hover:text-accent transition-colors">
              <ShoppingBag size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold text-white bg-accent rounded-full px-1">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 hover:text-accent transition-colors"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Category nav — desktop */}
        {categories.length > 0 && (
          <nav className="hidden md:flex items-center gap-6 h-11 border-t border-border">
            <Link to="/products" className="text-sm font-medium hover:text-accent transition-colors uppercase tracking-wide">
              Tất cả sản phẩm
            </Link>
            {categories.slice(0, 8).map((cat) => (
              <Link
                key={cat.id}
                to={`/products?category=${cat.id}`}
                className="text-sm font-medium hover:text-accent transition-colors uppercase tracking-wide whitespace-nowrap"
              >
                {cat.name}
              </Link>
            ))}
          </nav>
        )}

        {/* Mobile overlay */}
        {mobileOpen && (
          <div className="md:hidden border-t border-border pb-4 animate-fade-in">
            <form onSubmit={handleSearch} className="flex gap-2 pt-3 pb-4">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm kiếm..."
                className="flex-1 border border-border px-3 py-2 text-sm focus:outline-none focus:border-primary"
              />
              <button type="submit" className="btn-primary px-4 py-2">
                <Search size={16} />
              </button>
            </form>
            <nav className="flex flex-col gap-1">
              <Link to="/products" onClick={() => setMobileOpen(false)} className={clsx("px-1 py-2 text-sm font-medium hover:text-accent transition-colors uppercase tracking-wide")}>Tất cả sản phẩm</Link>
              {categories.map((cat) => (
                <Link key={cat.id} to={`/products?category=${cat.id}`} onClick={() => setMobileOpen(false)} className="px-1 py-2 text-sm font-medium hover:text-accent transition-colors uppercase tracking-wide">{cat.name}</Link>
              ))}
              {!isAuthenticated() && (
                <div className="pt-2 border-t border-border mt-2 flex gap-3">
                  <Link to="/login" onClick={() => setMobileOpen(false)} className="btn-outline text-xs px-4 py-2">Đăng nhập</Link>
                  <Link to="/register" onClick={() => setMobileOpen(false)} className="btn-primary text-xs px-4 py-2">Đăng ký</Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
