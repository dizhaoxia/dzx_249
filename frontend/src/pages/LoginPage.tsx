import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Spin } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;

export default function LoginPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values: { phone: string; password: string }) => {
    setLoading(true);
    try {
      await login(values);
      navigate('/orders');
    } catch {
      // error handled in request interceptor
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <Card className="auth-card" bordered={false}>
        <div className="auth-title">
          <Title level={2} style={{ marginBottom: 8 }}>
            🍱 同事午餐拼单
          </Title>
          <Text type="secondary">欢迎回来，请登录您的账号</Text>
        </div>
        <Spin spinning={loading}>
          <Form form={form} layout="vertical" onFinish={onFinish} size="large">
            <Form.Item
              label="手机号"
              name="phone"
              rules={[
                { required: true, message: '请输入手机号' },
                { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号格式' },
              ]}
            >
              <Input placeholder="请输入手机号" maxLength={11} />
            </Form.Item>
            <Form.Item
              label="密码"
              name="password"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 6, message: '密码长度至少6位' },
              ]}
            >
              <Input.Password placeholder="请输入密码" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block loading={loading}>
                登录
              </Button>
            </Form.Item>
            <div style={{ textAlign: 'center' }}>
              <Text type="secondary">
                还没有账号？ <Link to="/register">立即注册</Link>
              </Text>
            </div>
          </Form>
        </Spin>
      </Card>
    </div>
  );
}
