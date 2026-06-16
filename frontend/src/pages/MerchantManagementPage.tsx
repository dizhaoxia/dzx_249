import React, { useState, useEffect } from 'react';
import {
  Button,
  Card,
  List,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  Space,
  Typography,
  Row,
  Col,
  message,
  Popconfirm,
  Tag,
  Empty,
  Spin,
  Avatar,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ShopOutlined,
  AppstoreOutlined,
  EyeOutlined,
  GlobalOutlined,
  LockOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import {
  getMerchantList,
  createMerchant,
  updateMerchant,
  deleteMerchant,
  getMerchantDetail,
  createDish,
  updateDish,
  deleteDish,
} from '../api/orders';
import { Merchant, Dish } from '../types';
import { formatMoney } from '../utils/format';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const DISH_CATEGORIES = ['主食', '饮料', '小吃', '甜点', '汤品', '其他'];

interface MerchantFormData {
  name: string;
  description?: string;
  cover_image?: string;
  is_shared: boolean;
}

interface DishFormData {
  name: string;
  price: number;
  category?: string;
  image?: string;
}

export default function MerchantManagementPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [dishesLoading, setDishesLoading] = useState(false);

  const [merchantModalVisible, setMerchantModalVisible] = useState(false);
  const [editingMerchant, setEditingMerchant] = useState<Merchant | null>(null);
  const [merchantForm] = Form.useForm<MerchantFormData>();

  const [dishModalVisible, setDishModalVisible] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [dishForm] = Form.useForm<DishFormData>();

  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadMerchants();
  }, []);

  const loadMerchants = async () => {
    setLoading(true);
    try {
      const result = await getMerchantList();
      setMerchants(result.merchants);
    } catch (err) {
      console.error(err);
      message.error('获取商家列表失败');
    } finally {
      setLoading(false);
    }
  };

  const loadMerchantDishes = async (merchantId: string) => {
    setDishesLoading(true);
    try {
      const result = await getMerchantDetail(merchantId);
      setSelectedMerchant(result.merchant);
      setDishes(result.dishes);
    } catch (err) {
      console.error(err);
      message.error('获取菜品列表失败');
    } finally {
      setDishesLoading(false);
    }
  };

  const handleSelectMerchant = (merchant: Merchant) => {
    if (merchant.is_preset) {
      message.info('预设商家暂不支持编辑菜品');
      return;
    }
    loadMerchantDishes(merchant.id);
  };

  const openMerchantModal = (merchant?: Merchant) => {
    setEditingMerchant(merchant || null);
    if (merchant) {
      merchantForm.setFieldsValue({
        name: merchant.name,
        description: merchant.description || undefined,
        cover_image: merchant.cover_image || undefined,
        is_shared: merchant.is_shared === 1,
      });
    } else {
      merchantForm.resetFields();
      merchantForm.setFieldsValue({ is_shared: false });
    }
    setMerchantModalVisible(true);
  };

  const handleMerchantSubmit = async () => {
    try {
      const values = await merchantForm.validateFields();
      setActionLoading('merchant');
      if (editingMerchant) {
        await updateMerchant(editingMerchant.id, values);
        message.success('商家信息更新成功');
      } else {
        await createMerchant(values);
        message.success('商家创建成功');
      }
      setMerchantModalVisible(false);
      loadMerchants();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteMerchant = async (merchantId: string) => {
    setActionLoading('delete');
    try {
      await deleteMerchant(merchantId);
      message.success('商家删除成功');
      if (selectedMerchant?.id === merchantId) {
        setSelectedMerchant(null);
        setDishes([]);
      }
      loadMerchants();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const openDishModal = (dish?: Dish) => {
    setEditingDish(dish || null);
    if (dish) {
      dishForm.setFieldsValue({
        name: dish.name,
        price: dish.price,
        category: dish.category || undefined,
        image: dish.image || undefined,
      });
    } else {
      dishForm.resetFields();
      dishForm.setFieldsValue({ category: '主食' });
    }
    setDishModalVisible(true);
  };

  const handleDishSubmit = async () => {
    if (!selectedMerchant) return;
    try {
      const values = await dishForm.validateFields();
      setActionLoading('dish');
      if (editingDish) {
        await updateDish(selectedMerchant.id, editingDish.id, values);
        message.success('菜品更新成功');
      } else {
        await createDish(selectedMerchant.id, values);
        message.success('菜品添加成功');
      }
      setDishModalVisible(false);
      loadMerchantDishes(selectedMerchant.id);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteDish = async (dishId: string) => {
    if (!selectedMerchant) return;
    setActionLoading('deleteDish');
    try {
      await deleteDish(selectedMerchant.id, dishId);
      message.success('菜品删除成功');
      loadMerchantDishes(selectedMerchant.id);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const groupedDishes = dishes.reduce((acc, dish) => {
    const category = dish.category || '其他';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(dish);
    return acc;
  }, {} as Record<string, Dish[]>);

  const myMerchants = merchants.filter(m => !m.is_preset);
  const sharedPresetMerchants = merchants.filter(m => m.is_preset || m.is_shared === 1);

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Button onClick={() => navigate('/orders')}>返回</Button>
          <h1 className="page-title">商家管理</h1>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => openMerchantModal()}
        >
          添加商家
        </Button>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} md={8}>
          <Card
            title={
              <Space>
                <ShopOutlined />
                <span>我的商家</span>
              </Space>
            }
            bodyStyle={{ padding: 0 }}
          >
            <Spin spinning={loading}>
              {myMerchants.length === 0 ? (
                <Empty
                  description="暂无商家"
                  style={{ padding: '40px 0' }}
                />
              ) : (
                <List
                  dataSource={myMerchants}
                  renderItem={(merchant) => (
                    <List.Item
                      style={{
                        padding: '12px 16px',
                        cursor: 'pointer',
                        background: selectedMerchant?.id === merchant.id ? '#e6f4ff' : undefined,
                        borderBottom: '1px solid #f0f0f0',
                      }}
                      onClick={() => handleSelectMerchant(merchant)}
                      actions={[
                        <Button
                          key="edit"
                          type="text"
                          icon={<EditOutlined />}
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            openMerchantModal(merchant);
                          }}
                        />,
                        <Popconfirm
                          key="delete"
                          title="确定删除该商家吗？删除后关联的菜品也会被清除。"
                          onConfirm={(e) => {
                            e?.stopPropagation();
                            handleDeleteMerchant(merchant.id);
                          }}
                          okText="确定删除"
                          cancelText="取消"
                          okButtonProps={{ danger: true }}
                        >
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            size="small"
                            onClick={(e) => e.stopPropagation()}
                            loading={actionLoading === 'delete'}
                          />
                        </Popconfirm>,
                      ]}
                    >
                      <List.Item.Meta
                        avatar={
                          <Avatar
                            size="large"
                            icon={<ShopOutlined />}
                            src={merchant.cover_image || undefined}
                          />
                        }
                        title={
                          <Space>
                            <span>{merchant.name}</span>
                            {merchant.is_shared === 1 ? (
                              <Tag color="blue" icon={<GlobalOutlined />}>
                                共享
                              </Tag>
                            ) : (
                              <Tag color="default" icon={<LockOutlined />}>
                                私有
                              </Tag>
                            )}
                          </Space>
                        }
                        description={
                          <Space direction="vertical" size={0}>
                            <Text type="secondary" ellipsis style={{ maxWidth: 200 }}>
                              {merchant.description || '暂无简介'}
                            </Text>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              <AppstoreOutlined /> {merchant.dish_count || 0} 个菜品
                            </Text>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              )}
            </Spin>
          </Card>

          {sharedPresetMerchants.length > 0 && (
            <Card
              title={
                <Space>
                  <GlobalOutlined />
                  <span>共享商家</span>
                </Space>
              }
              bodyStyle={{ padding: 0 }}
              style={{ marginTop: 24 }}
            >
              <List
                dataSource={sharedPresetMerchants}
                renderItem={(merchant) => (
                  <List.Item
                    style={{
                      padding: '12px 16px',
                      cursor: merchant.is_preset ? 'default' : 'pointer',
                      borderBottom: '1px solid #f0f0f0',
                      opacity: merchant.is_preset ? 0.8 : 1,
                    }}
                    onClick={() => !merchant.is_preset && handleSelectMerchant(merchant)}
                    actions={
                      !merchant.is_preset
                        ? [
                            <Button
                              key="view"
                              type="text"
                              icon={<EyeOutlined />}
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectMerchant(merchant);
                              }}
                            />,
                          ]
                        : []
                    }
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          size="large"
                          icon={<ShopOutlined />}
                          src={merchant.cover_image || undefined}
                        />
                      }
                      title={
                        <Space>
                          <span>{merchant.name}</span>
                          {merchant.is_preset && <Tag color="gold">预设</Tag>}
                          {!merchant.is_preset && merchant.is_shared === 1 && (
                            <Tag color="blue" icon={<GlobalOutlined />}>
                              共享
                            </Tag>
                          )}
                        </Space>
                      }
                      description={
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          <AppstoreOutlined /> {merchant.dish_count || 0} 个菜品
                        </Text>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          )}
        </Col>

        <Col xs={24} md={16}>
          <Card
            title={
              selectedMerchant ? (
                <Space>
                  <Avatar
                    size="large"
                    icon={<ShopOutlined />}
                    src={selectedMerchant.cover_image || undefined}
                  />
                  <div>
                    <Title level={4} style={{ margin: 0 }}>
                      {selectedMerchant.name}
                    </Title>
                    <Text type="secondary">
                      {selectedMerchant.description || '暂无简介'}
                    </Text>
                  </div>
                </Space>
              ) : (
                <span>请选择一个商家查看菜品</span>
              )
            }
            extra={
              selectedMerchant && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => openDishModal()}
                >
                  添加菜品
                </Button>
              )
            }
          >
            <Spin spinning={dishesLoading}>
              {!selectedMerchant ? (
                <Empty
                  description="选择左侧商家查看和管理菜品"
                  style={{ padding: '60px 0' }}
                />
              ) : dishes.length === 0 ? (
                <Empty
                  description="暂无菜品，点击右上角添加"
                  style={{ padding: '60px 0' }}
                />
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
                      <List
                        grid={{ gutter: 16, xs: 1, sm: 2, md: 2, lg: 3 }}
                        dataSource={categoryDishes}
                        renderItem={(dish) => (
                          <List.Item>
                            <Card
                              hoverable
                              cover={
                                dish.image ? (
                                  <div
                                    style={{
                                      height: 140,
                                      backgroundImage: `url(${dish.image})`,
                                      backgroundSize: 'cover',
                                      backgroundPosition: 'center',
                                    }}
                                  />
                                ) : (
                                  <div
                                    style={{
                                      height: 140,
                                      background: '#f5f5f5',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      color: '#bfbfbf',
                                      fontSize: 32,
                                    }}
                                  >
                                    🍽️
                                  </div>
                                )
                              }
                              actions={[
                                <Button
                                  key="edit"
                                  type="text"
                                  icon={<EditOutlined />}
                                  size="small"
                                  onClick={() => openDishModal(dish)}
                                />,
                                <Popconfirm
                                  key="delete"
                                  title="确定删除该菜品吗？"
                                  onConfirm={() => handleDeleteDish(dish.id)}
                                  okText="确定删除"
                                  cancelText="取消"
                                  okButtonProps={{ danger: true }}
                                >
                                  <Button
                                    type="text"
                                    danger
                                    icon={<DeleteOutlined />}
                                    size="small"
                                    loading={actionLoading === 'deleteDish'}
                                  />
                                </Popconfirm>,
                              ]}
                            >
                              <Card.Meta
                                title={
                                  <div
                                    style={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                    }}
                                  >
                                    <span>{dish.name}</span>
                                    <span style={{ color: '#fa8c16', fontWeight: 600 }}>
                                      {formatMoney(dish.price)}
                                    </span>
                                  </div>
                                }
                              />
                            </Card>
                          </List.Item>
                        )}
                      />
                    </div>
                  ))}
                </Space>
              )}
            </Spin>
          </Card>
        </Col>
      </Row>

      <Modal
        title={editingMerchant ? '编辑商家' : '添加商家'}
        open={merchantModalVisible}
        onOk={handleMerchantSubmit}
        onCancel={() => setMerchantModalVisible(false)}
        confirmLoading={actionLoading === 'merchant'}
        okText={editingMerchant ? '保存修改' : '创建商家'}
      >
        <Form
          form={merchantForm}
          layout="vertical"
          initialValues={{ is_shared: false }}
        >
          <Form.Item
            label="商家名称"
            name="name"
            rules={[
              { required: true, message: '请输入商家名称' },
              { max: 50, message: '商家名称不能超过50个字符' },
            ]}
          >
            <Input placeholder="例如：麦当劳" maxLength={50} />
          </Form.Item>
          <Form.Item
            label="商家简介"
            name="description"
            rules={[{ max: 200, message: '简介不能超过200个字符' }]}
          >
            <TextArea
              placeholder="简单介绍一下这家店"
              rows={3}
              maxLength={200}
              showCount
            />
          </Form.Item>
          <Form.Item
            label="封面图片URL（可选）"
            name="cover_image"
            rules={[{ type: 'url', message: '请输入有效的URL' }]}
          >
            <Input placeholder="https://example.com/cover.jpg" />
          </Form.Item>
          <Form.Item
            label="是否共享"
            name="is_shared"
            valuePropName="checked"
            tooltip="开启后其他用户也可以看到并使用该商家及其菜单"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingDish ? '编辑菜品' : '添加菜品'}
        open={dishModalVisible}
        onOk={handleDishSubmit}
        onCancel={() => setDishModalVisible(false)}
        confirmLoading={actionLoading === 'dish'}
        okText={editingDish ? '保存修改' : '添加菜品'}
      >
        <Form
          form={dishForm}
          layout="vertical"
          initialValues={{ category: '主食' }}
        >
          <Form.Item
            label="菜品名称"
            name="name"
            rules={[
              { required: true, message: '请输入菜品名称' },
              { max: 100, message: '菜品名称不能超过100个字符' },
            ]}
          >
            <Input placeholder="例如：香辣鸡腿堡" maxLength={100} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="单价（元）"
                name="price"
                rules={[
                  { required: true, message: '请输入单价' },
                  { type: 'number', min: 0, max: 10000, message: '单价范围为0-10000' },
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  max={10000}
                  step={0.5}
                  precision={2}
                  prefix="¥"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="分类" name="category">
                <Select placeholder="选择分类">
                  {DISH_CATEGORIES.map((cat) => (
                    <Option key={cat} value={cat}>
                      {cat}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            label="菜品图片URL（可选）"
            name="image"
            rules={[{ type: 'url', message: '请输入有效的URL' }]}
          >
            <Input placeholder="https://example.com/dish.jpg" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
