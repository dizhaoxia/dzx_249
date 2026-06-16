import React, { useState } from 'react';
import { Input, Button, message, Space, Card, Typography, Tag, Divider } from 'antd';
import {
  CopyOutlined,
  LinkOutlined,
  ShareAltOutlined,
  ShopOutlined,
  ClockCircleOutlined,
  UserOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { copyToClipboard } from '../utils/format';
import { formatDateTime } from '../utils/format';

const { Text, Title } = Typography;

interface ShareLinkBoxProps {
  orderId: string;
  orderName: string;
  merchant: string;
  deadline?: string | null;
  participantCount: number;
  minParticipants?: number;
}

export default function ShareLinkBox({
  orderId,
  orderName,
  merchant,
  deadline,
  participantCount,
  minParticipants = 0,
}: ShareLinkBoxProps) {
  const [copying, setCopying] = useState(false);
  const [copyingCard, setCopyingCard] = useState(false);
  const [sharing, setSharing] = useState(false);

  const shareLink = `${window.location.origin}/orders/${orderId}`;

  const invitationCard = `🍱 ${orderName}
━━━━━━━━━━━━━━━━━━
🏪 商家：${merchant}
${deadline ? `⏰ 截止：${formatDateTime(deadline)}` : ''}
👥 已参与：${participantCount}人${minParticipants > 0 ? ` / 最低${minParticipants}人` : ''}
━━━━━━━━━━━━━━━━━━
🔗 点击链接加入拼单：
${shareLink}

快来一起点餐吧！`;

  const handleCopyLink = async () => {
    setCopying(true);
    try {
      await copyToClipboard(shareLink);
      message.success('拼单链接已复制到剪贴板');
    } catch {
      message.error('复制失败，请手动复制');
    } finally {
      setCopying(false);
    }
  };

  const handleCopyCard = async () => {
    setCopyingCard(true);
    try {
      await copyToClipboard(invitationCard);
      message.success('邀请卡片已复制到剪贴板，可直接粘贴到微信发送');
    } catch {
      message.error('复制失败，请手动复制');
    } finally {
      setCopyingCard(false);
    }
  };

  const handleShare = async () => {
    setSharing(true);
    try {
      if (navigator.share) {
        await navigator.share({
          title: orderName,
          text: invitationCard,
          url: shareLink,
        });
        message.success('已打开分享面板');
      } else {
        message.info('您的浏览器不支持直接分享，已为您复制邀请卡片');
        await copyToClipboard(invitationCard);
        message.success('邀请卡片已复制到剪贴板');
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Share error:', err);
        try {
          await copyToClipboard(invitationCard);
          message.success('邀请卡片已复制到剪贴板');
        } catch {
          message.error('分享失败，请手动复制');
        }
      }
    } finally {
      setSharing(false);
    }
  };

  const needsMoreParticipants = minParticipants > 0 && participantCount < minParticipants;

  return (
    <Card
      title={
        <Space>
          <ShareAltOutlined style={{ color: '#1677ff' }} />
          <span>分享拼单邀请</span>
        </Space>
      }
      style={{ marginTop: 24 }}
      extra={
        <Space>
          <Button
            icon={<ShareAltOutlined />}
            onClick={handleShare}
            loading={sharing}
          >
            分享
          </Button>
          <Button
            type="primary"
            icon={<CopyOutlined />}
            onClick={handleCopyCard}
            loading={copyingCard}
          >
            复制邀请
          </Button>
        </Space>
      }
    >
      <Card
        style={{
          background: 'linear-gradient(135deg, #e6f4ff 0%, #ffffff 100%)',
          border: '1px dashed #91caff',
          marginBottom: 16,
        }}
        bodyStyle={{ padding: 16 }}
      >
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <Title level={4} style={{ margin: 0, color: '#1677ff' }}>
            🍱 {orderName}
          </Title>
        </div>
        <Divider style={{ margin: '12px 0' }} />
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShopOutlined style={{ color: '#8c8c8c', width: 20 }} />
            <Text type="secondary">商家：</Text>
            <Text strong>{merchant}</Text>
          </div>
          {deadline && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ClockCircleOutlined style={{ color: '#8c8c8c', width: 20 }} />
              <Text type="secondary">截止：</Text>
              <Text>{formatDateTime(deadline)}</Text>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <UserOutlined style={{ color: '#8c8c8c', width: 20 }} />
            <Text type="secondary">参与：</Text>
            <Space>
              <Tag color={needsMoreParticipants ? 'warning' : 'success'}>
                {participantCount}人
              </Tag>
              {minParticipants > 0 && (
                <>
                  <Text type="secondary">/</Text>
                  <Tag color={needsMoreParticipants ? 'orange' : 'default'}>
                    最低 {minParticipants} 人
                  </Tag>
                  {needsMoreParticipants && (
                    <Text type="warning" style={{ fontSize: 12 }}>
                      还差 {minParticipants - participantCount} 人
                    </Text>
                  )}
                  {!needsMoreParticipants && minParticipants > 0 && (
                    <Tag color="green" icon={<CheckCircleOutlined />}>
                      已达标
                    </Tag>
                  )}
                </>
              )}
            </Space>
          </div>
        </Space>
        <Divider style={{ margin: '12px 0' }} />
        <div style={{ textAlign: 'center' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            点击下方按钮复制邀请，发送给同事一起点餐吧！
          </Text>
        </div>
      </Card>

      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        <div>
          <LinkOutlined style={{ marginRight: 8, color: '#389e0d' }} />
          <Text type="secondary" style={{ fontSize: 12 }}>
            拼单链接
          </Text>
        </div>
        <Space.Compact style={{ width: '100%' }}>
          <Input value={shareLink} readOnly />
          <Button
            type="primary"
            icon={<CopyOutlined />}
            onClick={handleCopyLink}
            loading={copying}
          >
            复制链接
          </Button>
        </Space.Compact>
      </Space>
    </Card>
  );
}
