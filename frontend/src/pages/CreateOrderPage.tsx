import React, { useEffect, useState } from 'react';
import {
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Button,
  Card,
  Spin,
  Space,
  Typography,
  Row,
  Col,
  Tag,
  Tooltip,
  Avatar,
} from 'antd';
import { ArrowLeftOutlined, ShopOutlined, AppstoreOutlined, GlobalOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import dayjs, { Dayjs } from 'dayjs';
import { getMerchants, createOrder } from '../api/orders';
import { PRESET_MERCHANTS } from '../config';
import { Merchant } from '../types';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

export default function CreateOrderPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadMerchants = async () => {
      setLoading(true);
      try {
        const result = await getMerchants();
        setMerchants(result.merchants);
      } catch {
        setMerchants(
          PRESET_MERCHANTS.map((name, index) => ({
            id: `preset-${index}`,
            name,
            cover_image: null,
            description: null,
            owner_id: '',
            is_shared: 1,
            created_at: '',
            updated_at: '',
            is_preset: true,
          }))
        );
      } finally {
        setLoading(false);
      }
    };
    loadMerchants();
  }, []);

  const onFinish = async (values: {
    name: string;
    merchantId: string;
    customMerchant?: string;
    deadline?: Dayjs;
    minParticipants?: number;
  }) => {
    setSubmitting(true);
    try {
      const selectedMerchant = merchants.find((m) => m.id === values.merchantId);
      const merchantName =
        values.merchantId === 'custom'
          ? values.customMerchant || ''
          : selectedMerchant?.name || '';
      const merchantId =
        values.merchantId === 'custom' || selectedMerchant?.is_preset
          ? undefined
          : values.merchantId;

      const result = await createOrder({
        name: values.name,
        merchant: merchantName,
        merchant_id: merchantId,
        deadline: values.deadline ? values.deadline.toISOString() : undefined,
        min_participants: values.minParticipants || 0,
      });
      navigate(`/orders/${result.orderId}`);
    } finally {
      setSubmitting(false);
    }
  };

  const merchantOptions = [
    ...merchants.map((m) => ({
      value: m.id,
      label: (
        <Space>
          <Avatar size="small" icon={<ShopOutlined />} src={m.cover_image || undefined} />
          <span>{m.name}</span>
          {m.is_preset && <Tag color="gold">预设</Tag>}
          {!m.is_preset && m.is_shared === 1 && (
            <Tag color="blue" icon={<GlobalOutlined />}>
              共享
            </Tag>
          )}
          {!m.is_preset && m.is_shared === 0 && (
            <Tag color="default" icon={<LockOutlined />}>
              私有
            </Tag>
          )}
          {!m.is_preset && (
            <Tag color="processing" icon={<AppstoreOutlined />}>
              {m.dish_count || 0} 菜品
            </Tag>
          )}
        </Space>
      ),
    })),
    {
      value: 'custom',
      label: (
        <Space>
          <span style={{ color: '#1677ff' }}>+ 自定义商家...</span>
        </Space>
      ),
    },
  ];

  const selectedMerchantId = Form.useWatch('merchantId', form);
  const selectedMerchant = merchants.find((m) => m.id === selectedMerchantId);
  const hasMenu = selectedMerchant && !selectedMerchant.is_preset && (selectedMerchant.dish_count || 0) > 0;

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/orders')}>
            返回
          </Button>
          <h1 className="page-title">发起拼单</h1>
        </div>
      </div>
      <Card style={{ maxWidth: 600, margin: '0 auto' }}>
        <Spin spinning={loading}>
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            size="large"
            initialValues={{
              merchantId: merchants[0]?.id,
              minParticipants: 0,
            }}
          >
            <Form.Item
              label="拼单名称"
              name="name"
              rules={[
                { required: true, message: '请输入拼单名称' },
                { max: 50, message: '拼单名称不能超过50个字符' },
              ]}
            >
              <Input placeholder="例如：周五一起来吃麦当劳" maxLength={50} />
            </Form.Item>

            <Form.Item
              label={
                <Space>
                  <span>商家</span>
                  <Link to="/merchants" target="_blank">
                    <Button type="link" size="small" style={{ padding: 0 }}>
                      管理商家和菜单
                    </Button>
                  </Link>
                </Space>
              }
              name="merchantId"
              rules={[{ required: true, message: '请选择商家' }]}
            >
              <Select
                options={merchantOptions}
                placeholder="选择商家"
                optionLabelProp="label"
              />
            </Form.Item>

            {selectedMerchant && (
              <div
                style={{
                  padding: 12,
                  background: hasMenu ? '#f6ffed' : '#fafafa',
                  borderRadius: 8,
                  marginBottom: 24,
                  border: `1px solid ${hasMenu ? '#b7eb8f' : '#d9d9d9'}`,
                }}
              >
                <Space>
                  <Avatar size="large" icon={<ShopOutlined />} src={selectedMerchant.cover_image || undefined} />
                  <div>
                    <div style={{ fontWeight: 600 }}>{selectedMerchant.name}</div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {selectedMerchant.description || '暂无简介'}
                    </Text>
                  </div>
                  {hasMenu ? (
                    <Tag color="green" icon={<AppstoreOutlined />}>
                      有菜单：{selectedMerchant.dish_count} 个菜品，可直接点餐
                    </Tag>
                  ) : !selectedMerchant.is_preset ? (
                    <Tag color="orange">
                      暂未添加菜品，请先到商家管理添加
                    </Tag>
                  ) : null}
                </Space>
              </div>
            )}

            {selectedMerchantId === 'custom' && (
              <Form.Item
                label="自定义商家名称"
                name="customMerchant"
                rules={[
                  { required: true, message: '请输入商家名称' },
                  { max: 50, message: '商家名称不能超过50个字符' },
                ]}
              >
                <Input placeholder="请输入商家名称" maxLength={50} />
              </Form.Item>
            )}

            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item label="点餐截止时间（可选）" name="deadline">
                  <DatePicker
                    showTime
                    format="YYYY-MM-DD HH:mm"
                    style={{ width: '100%' }}
                    placeholder="选择截止时间"
                    disabledDate={(current) =>
                      current && current < dayjs().startOf('day')
                    }
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  label={
                    <Tooltip title="参与人数未达标时会提醒发起人">
                      <Space>
                        最低参与人数
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          （可选）
                        </Text>
                      </Space>
                    </Tooltip>
                  }
                  name="minParticipants"
                  rules={[
                    {
                      type: 'number',
                      min: 0,
                      max: 100,
                      message: '范围为0-100',
                    },
                  ]}
                >
                  <InputNumber
                    min={0}
                    max={100}
                    style={{ width: '100%' }}
                    placeholder="0表示不限制"
                    addonAfter="人"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item style={{ marginTop: 24 }}>
              <Space style={{ width: '100%' }}>
                <Button block onClick={() => navigate('/orders')}>
                  取消
                </Button>
                <Button
                  type="primary"
                  block
                  htmlType="submit"
                  loading={submitting}
                >
                  创建拼单
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Spin>
      </Card>
      <div style={{ maxWidth: 600, margin: '16px auto 0' }}>
        <Text type="secondary">
          💡 提示：创建拼单后，您会自动成为发起人并加入拼单。您可以生成分享链接给同事，让他们加入点餐。
        </Text>
      </div>
    </div>
  );
}
