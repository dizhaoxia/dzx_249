import React from 'react';
import { Layout, Menu, Button, Dropdown, Avatar } from 'antd';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserOutlined, LogoutOutlined } from '@ant-design/icons';

const { Header, Content } = Layout;

export default function AppLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const selectedKey = location.pathname.includes('/orders') ? 'orders' : 'orders';

  const userMenu = {
    items: [
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: '退出登录',
        onClick: handleLogout,
      },
    ],
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          background: '#fff',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <h2 style={{ margin: 0, color: '#1677ff', fontSize: 20, fontWeight: 700 }}>
            🍱 午餐拼单
          </h2>
          <Menu
            mode="horizontal"
            selectedKeys={[selectedKey]}
            style={{ borderBottom: 'none', minWidth: 200 }}
          >
            <Menu.Item key="orders">
              <Link to="/orders">拼单列表</Link>
            </Menu.Item>
          </Menu>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link to="/orders/create">
            <Button type="primary">+ 发起拼单</Button>
          </Link>
          <Dropdown menu={userMenu} placement="bottomRight">
            <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar size="small" icon={<UserOutlined />} />
              <span style={{ color: '#333' }}>{user?.nickname}</span>
            </div>
          </Dropdown>
        </div>
      </Header>
      <Content style={{ padding: 0 }}>
        <div className="page-container">
          <Outlet />
        </div>
      </Content>
    </Layout>
  );
}
