import React from 'react';
import { Card, Tag, Button, Space, Typography, List, Avatar, Popconfirm } from 'antd';
import { UserOutlined, CrownOutlined, DeleteOutlined } from '@ant-design/icons';
import { Participant } from '../types';
import dayjs from 'dayjs';

const { Text } = Typography;

interface ParticipantListProps {
  participants: Participant[];
  isOwner: boolean;
  orderOwnerId: string;
  orderStatus: string;
  onRemoveParticipant: (userId: string) => void;
  removing: boolean;
}

export default function ParticipantList({
  participants,
  isOwner,
  orderOwnerId,
  orderStatus,
  onRemoveParticipant,
  removing,
}: ParticipantListProps) {
  return (
    <Card title={<span>👥 参与者 ({participants.length})</span>}>
      <List
        dataSource={participants}
        renderItem={(p) => (
          <List.Item
          >
            <List.Item.Meta
              avatar={<Avatar icon={<UserOutlined />} />}
              title={
                <Space>
                  <span>{p.nickname}</span>
                  {p.user_id === orderOwnerId && (
                    <Tag color="gold" icon={<CrownOutlined />}>
                      发起人
                    </Tag>
                  )}
                </Space>
              }
              description={
                <Text type="secondary">
                  加入时间: {dayjs(p.joined_at).format('MM-DD HH:mm')}
                </Text>
              }
            />
            {isOwner && p.user_id !== orderOwnerId && orderStatus === 'active' && (
              <Popconfirm
                title="确定要移除该参与者吗？其点餐记录将一并删除。"
                onConfirm={() => onRemoveParticipant(p.user_id)}
                okText="确定"
                cancelText="取消"
              >
                <Button
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                  loading={removing}
                >
                  移除
                </Button>
              </Popconfirm>
            )}
          </List.Item>
        )}
      />
    </Card>
  );
}
