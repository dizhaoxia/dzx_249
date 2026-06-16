import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  Button,
  Space,
  Tag,
  Typography,
  Spin,
  Popconfirm,
  Card,
  Row,
  Col,
  message,
  Divider,
  Avatar,
  Modal,
  Form,
  DatePicker,
  InputNumber,
  Alert,
} from 'antd';
import {
  ArrowLeftOutlined,
  ReloadOutlined,
  PlayCircleOutlined,
  StopOutlined,
  LogoutOutlined,
  DeleteOutlined,
  UserAddOutlined,
  ShopOutlined,
  ClockCircleOutlined,
  UserOutlined,
  CrownOutlined,
  EditOutlined,
  SettingOutlined,
  WarningOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs, { Dayjs } from 'dayjs';
import {
  getOrderDetail,
  joinOrder,
  leaveOrder,
  finishOrder,
  deleteOrder,
  removeParticipant,
  addOrderItem,
  updateOrderItem,
  deleteOrderItem,
  updateOrderDeadline,
  updateOrderMinParticipants,
} from '../api/orders';
import { OrderDetail, OrderItem } from '../types';
import { useAuth } from '../context/AuthContext';
import { formatMoney, formatDateTime } from '../utils/format';
import StatsCards from '../components/StatsCards';
import ParticipantList from '../components/ParticipantList';
import AllItemsList from '../components/AllItemsList';
import DishForm from '../components/DishForm';
import ShareLinkBox from '../components/ShareLinkBox';
import MenuOrdering from '../components/MenuOrdering';

const { Title, Text } = Typography;

interface DeadlineFormData {
  deadline: Dayjs;
}

interface MinParticipantsFormData {
  min_participants: number;
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [detail, setDetail] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [editingItem, setEditingItem] = useState<OrderItem | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const pollingRef = useRef<number | null>(null);

  const [deadlineModalVisible, setDeadlineModalVisible] = useState(false);
  const [deadlineForm] = Form.useForm<DeadlineFormData>();

  const [minParticipantsModalVisible, setMinParticipantsModalVisible] = useState(false);
  const [minParticipantsForm] = Form.useForm<MinParticipantsFormData>();

  const [showManualDishForm, setShowManualDishForm] = useState(false);

  const orderId = id || '';

  const loadDetail = useCallback(
    async (showLoading = false) => {
      if (showLoading) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      try {
        const result = await getOrderDetail(orderId);
        setDetail(result);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [orderId]
  );

  useEffect(() => {
    loadDetail(true);
  }, [loadDetail]);

  useEffect(() => {
    const startPolling = () => {
      if (detail && detail.order.status === 'active') {
        pollingRef.current = window.setInterval(() => {
          loadDetail(false);
        }, 3000);
      }
    };

    startPolling();

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [detail?.order.status, loadDetail]);

  const handleJoin = async () => {
    setActionLoading('join');
    try {
      const result = await joinOrder(orderId);
      setDetail(result);
      message.success('已加入拼单');
    } finally {
      setActionLoading(null);
    }
  };

  const handleLeave = async () => {
    setActionLoading('leave');
    try {
      const result = await leaveOrder(orderId);
      setDetail(result);
      message.success('已退出拼单，您的点餐记录已清除');
    } finally {
      setActionLoading(null);
    }
  };

  const handleFinish = async () => {
    setActionLoading('finish');
    try {
      const result = await finishOrder(orderId);
      setDetail(result);
      message.success('拼单已结束，可在历史账单中查看');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    setActionLoading('delete');
    try {
      await deleteOrder(orderId);
      message.success('拼单已删除');
      navigate('/orders');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveParticipant = async (userId: string) => {
    setActionLoading('remove');
    try {
      const result = await removeParticipant(orderId, userId);
      setDetail(result);
      message.success('已移除参与者');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddItem = async (data: {
    dish_name: string;
    price: number;
    quantity: number;
  }) => {
    setActionLoading('addItem');
    try {
      const result = await addOrderItem(orderId, data);
      setDetail(result);
      message.success('菜品添加成功');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateItem = async (data: {
    dish_name: string;
    price: number;
    quantity: number;
  }) => {
    if (!editingItem) return;
    setActionLoading('updateItem');
    try {
      const result = await updateOrderItem(orderId, editingItem.id, data);
      setDetail(result);
      setEditingItem(null);
      message.success('菜品修改成功');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    setActionLoading('deleteItem');
    try {
      const result = await deleteOrderItem(orderId, itemId);
      setDetail(result);
      message.success('菜品删除成功');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
  };

  const handleUpdateDeadline = async () => {
    try {
      const values = await deadlineForm.validateFields();
      setActionLoading('deadline');
      const result = await updateOrderDeadline(orderId, {
        deadline: values.deadline.toISOString(),
      });
      setDetail(result);
      setDeadlineModalVisible(false);
      message.success('截止时间已更新');
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateMinParticipants = async () => {
    try {
      const values = await minParticipantsForm.validateFields();
      setActionLoading('minParticipants');
      const result = await updateOrderMinParticipants(orderId, {
        min_participants: values.min_participants,
      });
      setDetail(result);
      setMinParticipantsModalVisible(false);
      message.success('最低参与人数已更新');
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const myItems = detail
    ? detail.orderItems.filter((item) => item.user_id === user?.id)
    : [];

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '60vh',
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (!detail) {
    return (
      <Card style={{ textAlign: 'center', padding: 60 }}>
        <Title level={3}>拼单不存在或已删除</Title>
        <Button type="primary" onClick={() => navigate('/orders')}>
          返回列表
        </Button>
      </Card>
    );
  }

  const { order, participants, orderItems, myAmount, totalAmount, participantCount, aaAmount, isOwner, isParticipant, dishes } = detail;
  const isFinished = order.status === 'finished';
  const isExpired = order.deadline && dayjs().isAfter(dayjs(order.deadline));
  const ownerNickname =
    participants.find((p) => p.user_id === order.owner_id)?.nickname || '';

  const minParticipants = order.min_participants || 0;
  const needsMoreParticipants = minParticipants > 0 && participantCount < minParticipants;
  const hasMenu = dishes && dishes.length > 0;

  const statusTag = isFinished ? (
    <Tag color="default" icon={<StopOutlined />}>已结束</Tag>
  ) : isExpired ? (
    <Tag color="orange">已超时</Tag>
  ) : (
    <Tag color="green" icon={<PlayCircleOutlined />}>进行中</Tag>
  );

  const finishConfirmContent = (
    <div>
      <p>确定要结束拼单吗？结束后将变为只读账单，无法再点餐。</p>
      {needsMoreParticipants && (
        <Alert
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          message={`当前参与人数 (${participantCount}人) 未达到最低要求 (${minParticipants}人)`}
          style={{ marginTop: 12 }}
        />
      )}
      {myAmount === 0 && isParticipant && (
        <Alert
          type="info"
          showIcon
          message="您还没有点餐，确定要结束拼单吗？"
          style={{ marginTop: 12 }}
        />
      )}
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/orders')}>
            返回
          </Button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <h1 className="page-title" style={{ margin: 0 }}>{order.name}</h1>
              {statusTag}
            </div>
          </div>
        </div>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => loadDetail(false)}
            loading={refreshing}
          >
            刷新
          </Button>
          {!isFinished && isOwner && (
            <Button
              icon={<SettingOutlined />}
              onClick={() => setMinParticipantsModalVisible(true)}
            >
              设置
            </Button>
          )}
          {!isFinished && isOwner && (
            <Popconfirm
              title={finishConfirmContent}
              onConfirm={handleFinish}
              okText="确定结束"
              cancelText="取消"
              okButtonProps={{ danger: true }}
            >
              <Button
                type="primary"
                danger
                icon={<StopOutlined />}
                loading={actionLoading === 'finish'}
              >
                结束拼单
              </Button>
            </Popconfirm>
          )}
          {!isFinished && isOwner && (
            <Popconfirm
              title="确定要删除该拼单吗？此操作不可恢复。"
              onConfirm={handleDelete}
              okText="确定删除"
              cancelText="取消"
              okButtonProps={{ danger: true }}
            >
              <Button
                danger
                icon={<DeleteOutlined />}
                loading={actionLoading === 'delete'}
              >
                删除拼单
              </Button>
            </Popconfirm>
          )}
        </Space>
      </div>

      {!isFinished && isOwner && needsMoreParticipants && (
        <Alert
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          message={`参与人数不足：当前 ${participantCount} 人，最低需要 ${minParticipants} 人，还差 ${minParticipants - participantCount} 人`}
          action={
            <Button size="small" type="primary" onClick={() => setMinParticipantsModalVisible(true)}>
              修改设置
            </Button>
          }
          style={{ marginBottom: 16 }}
          closable
        />
      )}

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card>
            <Row gutter={[16, 12]}>
              <Col xs={24} sm={12}>
                <Space>
                  <ShopOutlined style={{ color: '#8c8c8c' }} />
                  <Text type="secondary">商家：</Text>
                  <strong>{order.merchant}</strong>
                </Space>
              </Col>
              <Col xs={24} sm={12}>
                <Space>
                  <Avatar size="small" icon={<CrownOutlined style={{ fontSize: 12 }} />} />
                  <Text type="secondary">发起人：</Text>
                  <strong>{ownerNickname}</strong>
                </Space>
              </Col>
              <Col xs={24} sm={12}>
                <Space>
                  <ClockCircleOutlined style={{ color: '#8c8c8c' }} />
                  <Text type="secondary">创建时间：</Text>
                  {formatDateTime(order.created_at)}
                </Space>
              </Col>
              <Col xs={24} sm={12}>
                {order.deadline && (
                  <Space>
                    <ClockCircleOutlined style={{ color: isExpired ? '#fa8c16' : '#8c8c8c' }} />
                    <Text type="secondary">截止时间：</Text>
                    <span style={{ color: isExpired ? '#fa8c16' : undefined }}>
                      {formatDateTime(order.deadline)}
                      {isExpired && ' (已超时)'}
                    </span>
                    {!isFinished && isOwner && (
                      <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => {
                          deadlineForm.setFieldsValue({
                            deadline: dayjs(order.deadline!),
                          });
                          setDeadlineModalVisible(true);
                        }}
                      >
                        修改
                      </Button>
                    )}
                  </Space>
                )}
              </Col>
              {minParticipants > 0 && (
                <Col xs={24} sm={12}>
                  <Space>
                    <UserOutlined style={{ color: '#8c8c8c' }} />
                    <Text type="secondary">最低人数：</Text>
                    <Space>
                      <strong>{minParticipants} 人</strong>
                      {needsMoreParticipants ? (
                        <Tag color="orange" icon={<WarningOutlined />}>
                          还差 {minParticipants - participantCount} 人
                        </Tag>
                      ) : (
                        <Tag color="green" icon={<CheckCircleOutlined />}>
                          已达标
                        </Tag>
                      )}
                    </Space>
                  </Space>
                </Col>
              )}
              {isFinished && (
                <Col xs={24} sm={12}>
                  <Space>
                    <StopOutlined style={{ color: '#8c8c8c' }} />
                    <Text type="secondary">结束时间：</Text>
                    {formatDateTime(order.finished_at)}
                  </Space>
                </Col>
              )}
            </Row>

            <Divider />

            {!isFinished && !isParticipant && (
              <div
                style={{
                  textAlign: 'center',
                  padding: 24,
                  background: '#e6f4ff',
                  borderRadius: 8,
                  marginBottom: 16,
                }}
              >
                <Title level={4} style={{ marginBottom: 16 }}>
                  还未加入拼单
                </Title>
                <Button
                  type="primary"
                  size="large"
                  icon={<UserAddOutlined />}
                  onClick={handleJoin}
                  loading={actionLoading === 'join'}
                >
                  立即加入拼单
                </Button>
              </div>
            )}

            {!isFinished && isParticipant && !isOwner && (
              <div style={{ marginBottom: 16, textAlign: 'right' }}>
                <Popconfirm
                  title="确定要退出拼单吗？您的点餐记录将被清除。"
                  onConfirm={handleLeave}
                  okText="确定退出"
                  cancelText="取消"
                >
                  <Button
                    danger
                    icon={<LogoutOutlined />}
                    loading={actionLoading === 'leave'}
                  >
                    退出拼单
                  </Button>
                </Popconfirm>
              </div>
            )}

            <StatsCards
              myAmount={myAmount}
              totalAmount={totalAmount}
              participantCount={participantCount}
              aaAmount={aaAmount}
            />
          </Card>

          {isOwner && !isFinished && (
            <ShareLinkBox
              orderId={orderId}
              orderName={order.name}
              merchant={order.merchant}
              deadline={order.deadline}
              participantCount={participantCount}
              minParticipants={minParticipants}
            />
          )}

          {isParticipant && hasMenu && (
            <MenuOrdering
              orderId={orderId}
              dishes={dishes!}
              myItems={myItems}
              participants={participants}
              currentUserId={user?.id || ''}
              disabled={isFinished}
              onOrderUpdated={() => loadDetail(false)}
            />
          )}

          {isParticipant && (!hasMenu || showManualDishForm) && (
            <DishForm
              disabled={isFinished}
              editingItem={editingItem}
              onAdd={handleAddItem}
              onUpdate={handleUpdateItem}
              onCancelEdit={handleCancelEdit}
              myItems={myItems}
              currentUserId={user?.id || ''}
            />
          )}

          {isParticipant && hasMenu && !isFinished && (
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Button type="link" onClick={() => setShowManualDishForm(!showManualDishForm)}>
                {showManualDishForm ? '收起手动添加' : '需要手动添加菜品？'}
              </Button>
            </div>
          )}

          <AllItemsList
            items={orderItems}
            currentUserId={user?.id || ''}
            isOwner={isOwner}
            orderStatus={order.status}
            editingItem={editingItem}
            onEdit={(item) => setEditingItem(item)}
            onDelete={handleDeleteItem}
            deleting={actionLoading === 'deleteItem'}
          />
        </Col>

        <Col xs={24} lg={8}>
          <ParticipantList
            participants={participants}
            isOwner={isOwner}
            orderOwnerId={order.owner_id}
            orderStatus={order.status}
            onRemoveParticipant={handleRemoveParticipant}
            removing={actionLoading === 'remove'}
          />

          {isFinished && (
            <Card title={<span>📊 最终账单</span>} style={{ marginTop: 24 }}>
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <div
                  style={{
                    padding: 16,
                    background: '#f6ffed',
                    borderRadius: 8,
                    textAlign: 'center',
                  }}
                >
                  <div style={{ color: '#389e0d', marginBottom: 4 }}>每人应付金额</div>
                  <div
                    style={{
                      fontSize: 32,
                      fontWeight: 700,
                      color: '#52c41a',
                    }}
                  >
                    {formatMoney(aaAmount)}
                  </div>
                </div>
                <div style={{ padding: '8px 0' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '8px 0',
                      borderBottom: '1px dashed #f0f0f0',
                    }}
                  >
                    <span style={{ color: '#8c8c8c' }}>总金额</span>
                    <strong>{formatMoney(totalAmount)}</strong>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '8px 0',
                      borderBottom: '1px dashed #f0f0f0',
                    }}
                  >
                    <span style={{ color: '#8c8c8c' }}>参与人数</span>
                    <strong>{participantCount}人</strong>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '8px 0',
                    }}
                  >
                    <span style={{ color: '#8c8c8c' }}>计算方式</span>
                    <strong>AA制（总额÷人数）</strong>
                  </div>
                </div>
              </Space>
            </Card>
          )}
        </Col>
      </Row>

      <Modal
        title="修改截止时间"
        open={deadlineModalVisible}
        onOk={handleUpdateDeadline}
        onCancel={() => setDeadlineModalVisible(false)}
        confirmLoading={actionLoading === 'deadline'}
        okText="保存"
      >
        <Form form={deadlineForm} layout="vertical">
          <Form.Item
            label="新的截止时间"
            name="deadline"
            rules={[{ required: true, message: '请选择截止时间' }]}
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
        </Form>
      </Modal>

      <Modal
        title="拼单设置"
        open={minParticipantsModalVisible}
        onOk={handleUpdateMinParticipants}
        onCancel={() => setMinParticipantsModalVisible(false)}
        confirmLoading={actionLoading === 'minParticipants'}
        okText="保存"
      >
        <Form form={minParticipantsForm} layout="vertical">
          <Form.Item
            label={
              <Space>
                最低参与人数
                <Text type="secondary" style={{ fontSize: 12 }}>
                  （参与人数未达标时会提醒发起人）
                </Text>
              </Space>
            }
            name="min_participants"
            initialValue={minParticipants}
            rules={[
              { type: 'number', min: 0, max: 100, message: '范围为0-100' },
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
        </Form>
      </Modal>
    </div>
  );
}
