import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { User, Save } from 'lucide-react';
import { userApi } from '../../api/endpoints/userApi';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import type { UpdateProfileRequest } from '../../types';

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await userApi.getMyProfile();
      return res.data.data!;
    },
  });

  const [form, setForm] = useState<UpdateProfileRequest>({});

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setError('');
    try {
      await userApi.updateProfile(form);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message ?? 'Cập nhật thất bại');
    } finally {
      setSaving(false);
    }
  };

  const set = (k: keyof UpdateProfileRequest) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  if (isLoading) return <LoadingSpinner size="lg" />;
  if (!profile) return null;

  const initialValues: UpdateProfileRequest = {
    firstName: profile.firstName,
    lastName: profile.lastName,
    phone: profile.phone,
    address: profile.address,
    city: profile.city,
    country: profile.country,
  };

  return (
    <div className="container-shop py-12 max-w-3xl">
      <div className="mb-8">
        <p className="section-subtitle mb-1">Tài khoản</p>
        <h1 className="section-title">Thông tin cá nhân</h1>
      </div>

      <div className="bg-white border border-border">
        {/* Profile header */}
        <div className="flex items-center gap-5 p-6 border-b border-border">
          <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center">
            <User size={28} className="text-muted" />
          </div>
          <div>
            <p className="font-bold text-lg">{profile.firstName} {profile.lastName}</p>
            <p className="text-sm text-muted">{profile.email}</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium mb-2">Tên</label>
              <input
                type="text"
                defaultValue={initialValues.firstName}
                onChange={set('firstName')}
                placeholder={profile.firstName}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Họ</label>
              <input
                type="text"
                defaultValue={initialValues.lastName}
                onChange={set('lastName')}
                placeholder={profile.lastName}
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Số điện thoại</label>
            <input
              type="tel"
              defaultValue={initialValues.phone}
              onChange={set('phone')}
              placeholder="0901 234 567"
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Địa chỉ</label>
            <input
              type="text"
              defaultValue={initialValues.address}
              onChange={set('address')}
              placeholder="Số nhà, đường, phường/xã..."
              className="input"
            />
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium mb-2">Thành phố</label>
              <input
                type="text"
                defaultValue={initialValues.city}
                onChange={set('city')}
                placeholder="TP. Hồ Chí Minh"
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Quốc gia</label>
              <input
                type="text"
                defaultValue={initialValues.country}
                onChange={set('country')}
                placeholder="Việt Nam"
                className="input"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
          )}
          {saved && (
            <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-sm">Lưu thành công!</div>
          )}

          <button type="submit" disabled={saving} className="btn-primary px-8 py-3 text-sm flex items-center gap-2">
            <Save size={16} />
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </form>
      </div>
    </div>
  );
}