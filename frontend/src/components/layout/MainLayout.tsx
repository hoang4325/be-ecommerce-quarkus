import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, Avatar, Dropdown, Badge } from 'antd';
import type { MenuProps } from 'antd';
import {
  ShoppingOutlined,
  ShoppingCartOutlined,
  OrderedListOutlined,
  UserOutlined,
  LogoutOutlined,
  DashboardOutlined,
  AppstoreOutlined,
  BellOutlined,
  ContainerOutlined,
  CreditCardOutlined,
  DatabaseOutlined,
} from '@ant-design/icons';
import { authStore } from '../../auth/authStore';
import { notificationApi } from '../../api/endpoints/notificationApi';
import { useQuery } from '@tanstack/react-query';

const { Header, Sider, Content } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const { data: unreadData } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: () => notificationApi.getUnread().then((r) => r.data.data ?? []),
    refetchInterval: 30000,
  });

  const unreadCount = unreadData?.length ?? 0;

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'My Profile',
      onClick: () => navigate('/profile'),
    },
    {
      key: 'notifications',
      icon: <BellOutlined />,
      label: 'Notifications',
      onClick: () => navigate('/notifications'),
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: () => {
        authStore.logout();
        navigate('/login');
      },
    },
  ];

  const buildMenuItems = (): MenuItem[] => {
    const items: MenuItem[] = [
      {
        key: '/dashboard',
        icon: <DashboardOutlined />,
        label: 'Dashboard',
      },
      {
        key: '/products',
        icon: <ShoppingOutlined />,
        label: 'Products',
      },
      {
        key: '/cart',
        icon: <ShoppingCartOutlined />,
        label: 'Cart',
      },
      {
        key: '/orders',
        icon: <OrderedListOutlined />,
        label: 'My Orders',
      },
    ];

    if (authStore.isAdmin) {
      items.push({
        key: '/admin',
        icon: <AppstoreOutlined />,
        label: 'Admin',
        children: [
          {
            key: '/admin/orders',
            icon: <OrderedListOutlined />,
            label: 'Manage Orders',
          },
          {
            key: '/admin/products',
            icon: <ShoppingOutlined />,
            label: 'Manage Products',
          },
          {
            key: '/admin/categories',
            icon: <ContainerOutlined />,
            label: 'Categories',
          },
          {
            key: '/admin/inventory',
            icon: <DatabaseOutlined />,
            label: 'Inventory',
          },
          {
            key: '/admin/payments',
            icon: <CreditCardOutlined />,
            label: 'Payments',
          },
        ],
      });
    }

    return items;
  };

  const selectedKey = location.pathname;

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="dark"
        width={220}
      >
        <div
          style={{
            height: 32,
            margin: 16,
            color: '#fff',
            fontSize: collapsed ? 14 : 18,
            fontWeight: 'bold',
            textAlign: 'center',
            lineHeight: '32px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
          }}
        >
          {collapsed ? 'EC' : 'E-Commerce'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={buildMenuItems()}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: 16,
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          }}
        >
          <Badge count={unreadCount} size="small">
            <Button
              type="text"
              icon={<BellOutlined />}
              onClick={() => navigate('/notifications')}
            />
          </Badge>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar icon={<UserOutlined />} />
              <span>{authStore.user?.firstName || 'User'}</span>
            </div>
          </Dropdown>
        </Header>
        <Content style={{ margin: 24, padding: 24, background: '#f5f5f5', minHeight: 280 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;