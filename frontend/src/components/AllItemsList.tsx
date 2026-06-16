import React from 'react';
import { Card, Table, Tag, Typography, Button, Space, Popconfirm } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { OrderItem } from '../types';
import { formatMoney } from '../utils/format';

const { Title } = Typography;

interface AllItemsListProps {
  items: OrderItem[];
  currentUserId: string;
  isOwner: boolean;
  orderStatus: string;
  editingItem: OrderItem | null;
  onEdit: (item: OrderItem) => void;
  onDelete: (itemId: string) => void;
  deleting: boolean;
}

export default function AllItemsList({
  items,
  currentUserId,
  isOwner,
  orderStatus,
  editingItem,
  onEdit,
  onDelete,
  deleting,
}: AllItemsListProps) {
  const columns = [
    {
      title: '菜品',
      dataIndex: 'dish_name',
      key: 'dish_name',
    },
    {
      title: '点餐人',
      dataIndex: 'nickname',
      key: 'nickname',
      width: 100,
      render: (text: string, record: OrderItem) => (
        <Space>
          {text}
          {record.user_id === currentUserId && (
            <Tag color="blue">我</Tag>
          )}
        </Space>
      ),
    },
    {
      title: '单价',
      dataIndex: 'price',
      key: 'price',
      width: 100,
      render: (price: number) => formatMoney(price),
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 80,
    },
    {
      title: '小计',
      key: 'subtotal',
      width: 120,
      render: (_: any, record: OrderItem) => (
        <span style={{ fontWeight: 600 }}>
          {formatMoney(record.price * record.quantity)}
        </span>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_: any, record: OrderItem) => {
        const isMyItem = record.user_id === currentUserId;
        const canModify = orderStatus === 'active' && isMyItem;
        return (
          <Space>
            {canModify && (
              <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => onEdit(record)}
              loading={editingItem?.id === record.id && deleting === false}
            >
              修改
            </Button>
            )}
            {canModify && (
              <Popconfirm
                title="确定要删除这道菜品吗？"
                onConfirm={() => onDelete(record.id)}
                okText="确定"
                cancelText="取消"
              >
                <Button
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  loading={deleting}
                >
                  删除
                </Button>
              </Popconfirm>
            )}
            {!canModify && <span style={{ color: '#bfbfbf' }}>-</span>}
          </Space>
        );
      },
    },
  ];

  const groupedItems: Record<string, OrderItem[]> = {};
  items.forEach((item) => {
    if (!groupedItems[item.nickname]) {
      groupedItems[item.nickname] = [];
    }
    groupedItems[item.nickname].push(item);
  });

  return (
    <div className="all-items-section">
      <Title level={4} style={{ marginTop: 0, marginBottom: 16 }}>
        📋 全部点餐明细
      </Title>
      {items.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#8c8c8c', padding: 24 }}>
          暂无点餐记录
        </div>
      ) : (
        <Table
          dataSource={items}
          rowKey="id"
          columns={columns}
          pagination={false}
          size="middle"
          bordered
        />
      )}
      <div
        style={{
        marginTop: 16,
        textAlign: 'right',
        fontSize: 16,
        fontWeight: 600,
      }}
    >
      总计：
        <span style={{ color: '#1677ff' }}>
          {formatMoney(
            items.reduce((sum, item) => sum + item.price * item.quantity, 0)
          )}
        </span>
      </div>
    </div>
  );
}
