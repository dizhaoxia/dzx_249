import React, { useState, useEffect } from 'react';
import { Form, Input, InputNumber, Button, Space, Card, Typography, Divider, Row, Col } from 'antd';
import { PlusOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import { OrderItem } from '../types';
import { formatMoney } from '../utils/format';

const { Title } = Typography;

interface DishFormData {
  dish_name: string;
  price: number;
  quantity: number;
}

interface DishFormProps {
  disabled?: boolean;
  editingItem: OrderItem | null;
  onAdd: (data: DishFormData) => void;
  onUpdate: (data: DishFormData) => void;
  onCancelEdit: () => void;
  myItems: OrderItem[];
  currentUserId: string;
}

export default function DishForm({
  disabled,
  editingItem,
  onAdd,
  onUpdate,
  onCancelEdit,
  myItems,
}: DishFormProps) {
  const [form] = Form.useForm<DishFormData>();
  const [subTotal, setSubTotal] = useState(0);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (editingItem) {
      setIsEditing(true);
      form.setFieldsValue({
        dish_name: editingItem.dish_name,
        price: editingItem.price,
        quantity: editingItem.quantity,
      });
      setSubTotal(editingItem.price * editingItem.quantity);
    }
  }, [editingItem, form]);

  const dishName = Form.useWatch('dish_name', form);
  const price = Form.useWatch('price', form);
  const quantity = Form.useWatch('quantity', form);

  useEffect(() => {
    const p = Number(price) || 0;
    const q = Number(quantity) || 0;
    setSubTotal(p * q);
  }, [price, quantity]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (isEditing) {
        onUpdate(values);
      } else {
        onAdd(values);
        form.resetFields();
        form.setFieldsValue({ quantity: 1 });
      }
      setIsEditing(false);
      setSubTotal(0);
    } catch {
      // validation error
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setSubTotal(0);
    form.resetFields();
    form.setFieldsValue({ quantity: 1 });
    onCancelEdit();
  };

  const myTotal = myItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <Card
      title={
        <div>
          🍽️ {isEditing ? '修改菜品' : '添加菜品'}
          {!disabled && (
            <span style={{ float: 'right', fontWeight: 500, color: '#52c41a' }}>
              我的点餐总计：{formatMoney(myTotal)}
            </span>
          )}
        </div>
      }
      style={{ marginTop: 24 }}
    >
      {disabled ? (
        <div style={{ textAlign: 'center', color: '#8c8c8c', padding: 16 }}>
          拼单已结束，无法修改点餐
        </div>
      ) : (
        <Form
          form={form}
          layout="horizontal"
          initialValues={{ quantity: 1 }}
          onFinish={handleSubmit}
        >
          <Row gutter={[12, 12]}>
            <Col xs={24} sm={24} md={10}>
              <Form.Item
                label="菜品名"
                name="dish_name"
                rules={[
                  { required: true, message: '请输入菜品名' },
                  { max: 100, message: '菜品名称不能超过100个字符' },
                ]}
                style={{ marginBottom: 0 }}
              >
                <Input placeholder="例如：香辣鸡腿堡" maxLength={100} />
              </Form.Item>
            </Col>
            <Col xs={12} sm={12} md={5}>
              <Form.Item
                label="单价"
                name="price"
                rules={[
                  { required: true, message: '请输入单价' },
                  {
                    type: 'number',
                    min: 0,
                    max: 10000,
                    message: '单价范围为0-10000',
                  },
                ]}
                style={{ marginBottom: 0 }}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="0.00"
                  min={0}
                  max={10000}
                  step={0.5}
                  precision={2}
                  prefix="¥"
                />
              </Form.Item>
            </Col>
            <Col xs={12} sm={12} md={5}>
              <Form.Item
                label="数量"
                name="quantity"
                rules={[
                  { required: true, message: '请输入数量' },
                  {
                    type: 'number',
                    min: 1,
                    max: 999,
                    message: '数量范围为1-999',
                  },
                ]}
                style={{ marginBottom: 0 }}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="1"
                  min={1}
                  max={999}
                  step={1}
                  precision={0}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={24} md={4}>
              <Form.Item label="小计" style={{ marginBottom: 0 }}>
                <div
                  style={{
                    height: 32,
                    lineHeight: '32px',
                    fontWeight: 600,
                    color: '#1677ff',
                  }}
                >
                  {formatMoney(subTotal)}
                </div>
              </Form.Item>
            </Col>
          </Row>
          <Divider style={{ margin: '16px 0' }} />
          <Space>
            {isEditing ? (
              <>
                <Button type="primary" icon={<SaveOutlined />} htmlType="submit">
                  保存修改
                </Button>
                <Button icon={<CloseOutlined />} onClick={handleCancelEdit}>
                  取消
                </Button>
              </>
            ) : (
              <Button type="primary" icon={<PlusOutlined />} htmlType="submit">
                添加菜品
              </Button>
            )}
          </Space>
        </Form>
      )}
    </Card>
  );
}
