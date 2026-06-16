import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Button,
  InputNumber,
  Space,
  Typography,
  Row,
  Col,
  Tag,
  Empty,
  message,
  Popconfirm,
  Avatar,
  Divider,
  Select,
} from 'antd';
import {
  ShoppingCartOutlined,
  DeleteOutlined,
  CopyOutlined,
  MinusOutlined,
  PlusOutlined,
  AppstoreOutlined,
  CheckOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { Dish, OrderItem, Participant } from '../types';
import { formatMoney } from '../utils/format';
import { batchAddOrderItems, copyOrderItems, clearMyOrderItems } from '../api/orders';

const { Title, Text } = Typography;
const { Option } = Select;

interface MenuOrderingProps {
  orderId: string;
  dishes: Dish[];
  myItems: OrderItem[];
  participants: Participant[];
  currentUserId: string;
  disabled?: boolean;
  onOrderUpdated: () => void;
}

interface DishQuantity {
  [dishId: string]: number;
}

export default function MenuOrdering({
  orderId,
  dishes,
  myItems,
  participants,
  currentUserId,
  disabled,
  onOrderUpdated,
}: MenuOrderingProps) {
  const [quantities, setQuantities] = useState<DishQuantity>({});
  const [copyFromUserId, setCopyFromUserId] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const initialQuantities: DishQuantity = {};
    myItems.forEach((item) => {
      if (item.dish_id) {
        initialQuantities[item.dish_id] = item.quantity;
      }
    });
    setQuantities(initialQuantities);
  }, [myItems]);

  const groupedDishes = useMemo(() => {
    return dishes.reduce((acc, dish) => {
      const category = dish.category || '其他';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(dish);
      return acc;
    }, {} as Record<string, Dish[]>);
  }, [dishes]);

  const myTotal = useMemo(() => {
    return Object.entries(quantities).reduce((sum, [dishId, qty]) => {
      const dish = dishes.find((d) => d.id === dishId);
      return sum + (dish?.price || 0) * qty;
    }, 0);
  }, [quantities, dishes]);

  const selectedCount = useMemo(() => {
    return Object.values(quantities).reduce((sum, qty) => sum + (qty > 0 ? 1 : 0), 0);
  }, [quantities]);

  const handleQuantityChange = (dishId: string, value: number | null) => {
    const qty = value || 0;
    setQuantities((prev) => ({
      ...prev,
      [dishId]: qty,
    }));
  };

  const increaseQuantity = (dishId: string) => {
    setQuantities((prev) => ({
      ...prev,
      [dishId]: (prev[dishId] || 0) + 1,
    }));
  };

  const decreaseQuantity = (dishId: string) => {
    setQuantities((prev) => ({
      ...prev,
      [dishId]: Math.max(0, (prev[dishId] || 0) - 1),
    }));
  };

  const handleSubmit = async () => {
    const items = Object.entries(quantities)
      .filter(([_, qty]) => qty > 0)
      .map(([dishId, qty]) => {
        const dish = dishes.find((d) => d.id === dishId);
        return {
          dish_name: dish!.name,
          price: dish!.price,
          quantity: qty,
          dish_id: dishId,
        };
      });

    if (items.length === 0) {
      message.warning('请至少选择一道菜品');
      return;
    }

    setActionLoading('submit');
    try {
      await clearMyOrderItems(orderId);
      await batchAddOrderItems(orderId, { items });
      message.success('点餐成功！');
      onOrderUpdated();
    } catch (err) {
      console.error(err);
      message.error('点餐失败，请重试');
    } finally {
      setActionLoading(null);
    }
  };

  const handleClear = async () => {
    setActionLoading('clear');
    try {
      await clearMyOrderItems(orderId);
      setQuantities({});
      message.success('已清空点餐');
      onOrderUpdated();
    } catch (err) {
      console.error(err);
      message.error('清空失败，请重试');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCopy = async () => {
    if (!copyFromUserId) {
      message.warning('请选择要复制的用户');
      return;
    }
    setActionLoading('copy');
    try {
      await copyOrderItems(orderId, { from_user_id: copyFromUserId });
      message.success('复制成功！');
      setCopyFromUserId('');
      onOrderUpdated();
    } catch (err) {
      console.error(err);
      message.error('复制失败，请重试');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReset = () => {
    const initialQuantities: DishQuantity = {};
    myItems.forEach((item) => {
      if (item.dish_id) {
        initialQuantities[item.dish_id] = item.quantity;
      }
    });
    setQuantities(initialQuantities);
    message.info('已重置为当前点餐');
  };

  const otherParticipants = participants.filter((p) => p.user_id !== currentUserId);

  if (dishes.length === 0) {
    return (
      <Card title="🍽️ 菜单点餐" style={{ marginTop: 24 }}>
        <Empty description="该商家暂未设置菜单，请使用手动添加菜品功能" />
      </Card>
    );
  }

  return (
    <Card
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <ShoppingCartOutlined />
            <span>菜单点餐</span>
            {selectedCount > 0 && (
              <Tag color="blue">已选 {selectedCount} 种</Tag>
            )}
          </Space>
          <span style={{ fontWeight: 500, color: '#52c41a', fontSize: 16 }}>
            我的点餐总计：{formatMoney(myTotal)}
          </span>
        </div>
      }
      style={{ marginTop: 24 }}
      extra={
        !disabled && (
          <Space>
            <Select
              placeholder="复制他人点餐"
              style={{ width: 160 }}
              value={copyFromUserId || undefined}
              onChange={setCopyFromUserId}
              allowClear
              disabled={actionLoading !== null}
            >
              {otherParticipants.map((p) => (
                <Option key={p.user_id} value={p.user_id}>
                  {p.nickname}
                </Option>
              ))}
            </Select>
            <Button
              icon={<CopyOutlined />}
              onClick={handleCopy}
              disabled={!copyFromUserId || actionLoading !== null}
              loading={actionLoading === 'copy'}
            >
              复制
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleReset}
              disabled={actionLoading !== null}
            >
              重置
            </Button>
            <Popconfirm
              title="确定清空所有已点菜品吗？"
              onConfirm={handleClear}
              okText="确定清空"
              cancelText="取消"
            >
              <Button
                danger
                icon={<DeleteOutlined />}
                disabled={actionLoading !== null}
                loading={actionLoading === 'clear'}
              >
                清空
              </Button>
            </Popconfirm>
            <Button
              type="primary"
              icon={<CheckOutlined />}
              onClick={handleSubmit}
              disabled={selectedCount === 0 || actionLoading !== null}
              loading={actionLoading === 'submit'}
            >
              确认点餐
            </Button>
          </Space>
        )
      }
    >
      {disabled ? (
        <div style={{ textAlign: 'center', color: '#8c8c8c', padding: 16 }}>
          拼单已结束，无法修改点餐
        </div>
      ) : (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {Object.entries(groupedDishes).map(([category, categoryDishes]) => (
            <div key={category}>
              <Title level={5} style={{ marginBottom: 16 }}>
                <Tag color="blue">{category}</Tag>
                <Text type="secondary" style={{ fontWeight: 'normal', marginLeft: 8 }}>
                  ({categoryDishes.length} 个菜品)
                </Text>
              </Title>
              <Row gutter={[16, 16]}>
                {categoryDishes.map((dish) => {
                  const qty = quantities[dish.id] || 0;
                  const isSelected = qty > 0;
                  const subtotal = dish.price * qty;

                  return (
                    <Col xs={24} sm={12} md={8} lg={6} key={dish.id}>
                      <Card
                        hoverable
                        style={{
                          borderColor: isSelected ? '#1677ff' : '#f0f0f0',
                          boxShadow: isSelected ? '0 2px 8px rgba(22, 119, 255, 0.15)' : 'none',
                        }}
                        bodyStyle={{ padding: 12 }}
                      >
                        <div
                          style={{
                            height: 100,
                            borderRadius: 8,
                            overflow: 'hidden',
                            marginBottom: 12,
                            background: dish.image ? `url(${dish.image}) center/cover no-repeat` : '#f5f5f5',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 32,
                          }}
                        >
                          {!dish.image && '🍽️'}
                        </div>
                        <div style={{ marginBottom: 8 }}>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: 4,
                            }}
                          >
                            <Text strong style={{ fontSize: 14 }} ellipsis>
                              {dish.name}
                            </Text>
                            <Text style={{ color: '#fa8c16', fontWeight: 600, whiteSpace: 'nowrap' }}>
                              {formatMoney(dish.price)}
                            </Text>
                          </div>
                          {isSelected && (
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              小计：{formatMoney(subtotal)}
                            </Text>
                          )}
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                          }}
                        >
                          <Button
                            shape="circle"
                            icon={<MinusOutlined />}
                            size="small"
                            onClick={() => decreaseQuantity(dish.id)}
                            disabled={qty === 0}
                          />
                          <InputNumber
                            min={0}
                            max={99}
                            value={qty}
                            onChange={(val) => handleQuantityChange(dish.id, val)}
                            style={{ width: 60, textAlign: 'center' }}
                            controls={false}
                          />
                          <Button
                            shape="circle"
                            icon={<PlusOutlined />}
                            size="small"
                            type={qty > 0 ? 'primary' : 'default'}
                            onClick={() => increaseQuantity(dish.id)}
                          />
                        </div>
                      </Card>
                    </Col>
                  );
                })}
              </Row>
            </div>
          ))}
        </Space>
      )}

      {selectedCount > 0 && !disabled && (
        <>
          <Divider style={{ margin: '24px 0 16px' }} />
          <Card
            style={{
              background: 'linear-gradient(135deg, #e6f4ff 0%, #ffffff 100%)',
              border: '1px solid #91caff',
            }}
            bodyStyle={{ padding: 16 }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Space>
                <AppstoreOutlined style={{ color: '#1677ff', fontSize: 20 }} />
                <div>
                  <div style={{ fontWeight: 600 }}>已选菜品</div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    共 {selectedCount} 种菜品
                  </Text>
                </div>
              </Space>
              <Space size="large">
                <div style={{ textAlign: 'right' }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    预计金额
                  </Text>
                  <div
                    style={{
                      fontSize: 24,
                      fontWeight: 700,
                      color: '#1677ff',
                    }}
                  >
                    {formatMoney(myTotal)}
                  </div>
                </div>
                <Button
                  type="primary"
                  size="large"
                  icon={<CheckOutlined />}
                  onClick={handleSubmit}
                  loading={actionLoading === 'submit'}
                >
                  确认点餐
                </Button>
              </Space>
            </div>
          </Card>
        </>
      )}
    </Card>
  );
}
