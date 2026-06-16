import React, { useEffect, useState } from 'react';
import {
  Tabs,
  Card,
  List,
  Tag,
  Empty,
  Button,
  Space,
  Typography,
  Spin,
} from 'antd';
import {
  PlusOutlined,
  TeamOutlined,
  ShopOutlined,
  ClockCircleOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getOrders } from '../api/orders';
import { GroupOrderListItem } from '../types';
import { formatMoney, formatDateTime } from '../utils/format';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

type StatusType = 'active' | 'finished';

export default function OrderListPage() {
  const [activeTab, setActiveTab] = useState<StatusType>('active');
  const [loading, setLoading] = useState(false);
  const [activeOrders, setActiveOrders] = useState<GroupOrderListItem[]>([]);
  const [finishedOrders, setFinishedOrders] = useState<GroupOrderListItem[]>([]);
  const navigate = useNavigate();

  const loadOrders = async (status: StatusType) => {
    setLoading(true);
    try {
      const result = await getOrders(status);
      if (status === 'active') {
        setActiveOrders(result.orders);
      } else {
        setFinishedOrders(result.orders);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders('active');
  }, []);

  useEffect(() => {
    if (activeTab === 'finished' && finishedOrders.length === 0) {
      loadOrders('finished');
    }
  }, [activeTab]);

  const handleTabChange = (key: string) => {
    const status = key as StatusType;
    setActiveTab(status);
    loadOrders(status);
  };

  const renderOrderCard = (order: GroupOrderListItem) => {
    const isExpired =
      order.deadline && dayjs().isAfter(dayjs(order.deadline));
    const statusTag =
      order.status === 'active' ? (
        isExpired ? (
          <Tag color="orange">已超时</Tag>
        ) : (
          <Tag color="green">进行中</Tag>
        )
      ) : (
        <Tag color="default">已结束</Tag>
      );

    return (
      <Card
        hoverable
        style={{ marginBottom: 16 }}
        onClick={() => navigate(`/orders/${order.id}`)}
        actions={[
          <Button type="link" icon={<EyeOutlined />} key="view">
            查看详情
          </Button>,
        ]}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 12,
          }}
        >
          <div>
            <Title level={4} style={{ margin: 0 }}>
              {order.name}
            </Title>
            <div style={{ marginTop: 4 }}>{statusTag}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div
              style={{ fontSize: 24, fontWeight: 600, color: '#1677ff' }}
            >
              {formatMoney(order.total_amount)}
            </div>
            <Text type="secondary">总金额</Text>
          </div>
        </div>
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Space size="middle">
            <span>
              <ShopOutlined style={{ marginRight: 4 }} />
              {order.merchant}
            </span>
            <span>
              <TeamOutlined style={{ marginRight: 4 }} />
              {order.participant_count}人参与
            </span>
          </Space>
          {order.deadline && (
            <Text type="secondary">
              <ClockCircleOutlined style={{ marginRight: 4 }} />
              截止: {formatDateTime(order.deadline)}
              {isExpired && <Tag color="orange" style={{ marginLeft: 8 }}>已超时</Tag>}
            </Text>
          )}
          <Text type="secondary">创建于 {formatDateTime(order.created_at)}</Text>
        </Space>
      </Card>
    );
  };

  const renderTabContent = (orders: GroupOrderListItem[]) => {
    if (loading) {
      return (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <Spin size="large" />
        </div>
      );
    }

    if (orders.length === 0) {
      return (
        <Empty
          description={
            activeTab === 'active' ? '暂无进行中的拼单' : '暂无历史账单'
          }
          style={{ padding: 60 }}
        />
      );
    }

    return (
      <List
        dataSource={orders}
        renderItem={(order) => <div key={order.id}>{renderOrderCard(order)}</div>}
      />
    );
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">我的拼单</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/orders/create')}
        >
          发起拼单
        </Button>
      </div>
      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        items={[
          {
            key: 'active',
            label: `进行中 (${activeOrders.length})`,
            children: renderTabContent(activeOrders),
          },
          {
            key: 'finished',
            label: `历史账单 (${finishedOrders.length})`,
            children: renderTabContent(finishedOrders),
          },
        ]}
      />
    </div>
  );
}
