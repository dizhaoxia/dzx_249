import React, { useEffect, useState } from 'react';
import {
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Card,
  Spin,
  Space,
  Typography,
  Row,
  Col,
} from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs, { Dayjs } from 'dayjs';
import { getMerchants, createOrder } from '../api/orders';
import { PRESET_MERCHANTS } from '../config';

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function CreateOrderPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [merchants, setMerchants] = useState<string[]>(PRESET_MERCHANTS);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadMerchants = async () => {
      setLoading(true);
      try {
        const result = await getMerchants();
        setMerchants(result.merchants);
      } catch {
        setMerchants(PRESET_MERCHANTS);
      } finally {
        setLoading(false);
      }
    };
    loadMerchants();
  }, []);

  const onFinish = async (values: {
    name: string;
    merchant: string;
    customMerchant?: string;
    deadline?: Dayjs;
  }) => {
    setSubmitting(true);
    try {
      const merchant =
        values.merchant === 'custom' ? values.customMerchant || '' : values.merchant;
      const result = await createOrder({
        name: values.name,
        merchant,
        deadline: values.deadline ? values.deadline.toISOString() : undefined,
      });
      navigate(`/orders/${result.orderId}`);
    } finally {
      setSubmitting(false);
    }
  };

  const merchantOptions = [
    ...merchants.map((m) => ({ value: m, label: m })),
    { value: 'custom', label: '自定义商家...' },
  ];

  const selectedMerchant = Form.useWatch('merchant', form);

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/orders')}
          >
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
            initialValues={{ merchant: merchants[0] }}
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
              label="商家"
              name="merchant"
              rules={[{ required: true, message: '请选择或输入商家' }]}
            >
              <Select options={merchantOptions} placeholder="选择商家" />
            </Form.Item>

            {selectedMerchant === 'custom' && (
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

            <Form.Item
              label="点餐截止时间（可选）"
              name="deadline"
            >
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
