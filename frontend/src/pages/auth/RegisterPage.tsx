import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../auth/authService';
import type { RegisterRequest } from '../../types';

export default function RegisterPage() {
  const [form, setForm] = useState<RegisterRequest>({ firstName: '', lastName: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const set = (k: keyof RegisterRequest) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await authService.register(form);
      navigate('/login?registered=1');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string; errors?: { message: string }[] } } };
      const errData = axiosErr.response?.data;
      if (errData?.errors?.length) {
        setError(errData.errors.map(e => e.message).join(', '));
      } else {
        setError(errData?.message ?? 'Đăng ký thất bại. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="text-3xl font-black tracking-tight text-primary">VELORA</Link>
          <h1 className="text-xl font-bold mt-4 mb-1">Tạo tài khoản mới</h1>
          <p className="text-muted text-sm">Tham gia cùng hàng nghìn khách hàng của chúng tôi</p>
        </div>

        <div className="bg-white p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Tên <span className="text-accent">*</span></label>
                <input type="text" value={form.firstName} onChange={set('firstName')} required placeholder="Tên" className="input" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Họ <span className="text-accent">*</span></label>
                <input type="text" value={form.lastName} onChange={set('lastName')} required placeholder="Họ" className="input" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email <span className="text-accent">*</span></label>
              <input type="email" value={form.email} onChange={set('email')} required placeholder="email@example.com" className="input" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Mật khẩu <span className="text-accent">*</span>
                <span className="text-xs text-muted font-normal ml-1">(tối thiểu 6 ký tự)</span>
              </label>
              <input type="password" value={form.password} onChange={set('password')} required minLength={6} placeholder="••••••••" className="input" />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-4 text-sm mt-2">
              {loading ? 'Đang đăng ký...' : 'Tạo tài khoản'}
            </button>
          </form>

          <div className="text-center mt-6 text-sm text-muted">
            Đã có tài khoản?{' '}
            <Link to="/login" className="text-primary font-semibold hover:text-accent transition-colors">
              Đăng nhập
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-muted mt-6">
          <Link to="/" className="hover:text-primary transition-colors">← Quay về trang chủ</Link>
        </p>
      </div>
    </div>
  );
}