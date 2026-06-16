import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Spin } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;

export default function RegisterPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values: {
    phone: string;
    password: string;
    nickname: string;
  }) => {
    setLoading(true);
    try {
      await register(values);
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
            🍱 注册账号
          </Title>
          <Text type="secondary">创建账号，开始午餐拼单</Text>
        </div>
        <Spin spinning={loading}>
          <Form form={form} layout="vertical" onFinish={onFinish} size="large">
            <Form.Item
              label="昵称"
              name="nickname"
              rules={[
                { required: true, message: '请输入昵称' },
                { min: 1, max: 20, message: '昵称长度为1-20个字符' },
              ]}
            >
              <Input placeholder="请输入昵称" maxLength={20} />
            </Form.Item>
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
              <Input.Password placeholder="请输入密码（至少6位）" />
            </Form.Item>
            <Form.Item
              label="确认密码"
              name="confirmPassword"
              dependencies={['password']}
              rules={[
                { required: true, message: '请再次输入密码' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('两次输入的密码不一致'));
                  },
                }),
              ]}
            >
              <Input.Password placeholder="请再次输入密码" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block loading={loading}>
                注册
              </Button>
            </Form.Item>
            <div style={{ textAlign: 'center' }}>
              <Text type="secondary">
                已有账号？ <Link to="/login">返回登录</Link>
              </Text>
            </div>
          </Form>
        </Spin>
      </Card>
    </div>
  );
}
