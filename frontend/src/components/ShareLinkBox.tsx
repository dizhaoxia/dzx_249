import React, { useState } from 'react';
import { Input, Button, message, Space } from 'antd';
import { CopyOutlined, LinkOutlined } from '@ant-design/icons';
import { copyToClipboard } from '../utils/format';

interface ShareLinkBoxProps {
  orderId: string;
}

export default function ShareLinkBox({ orderId }: ShareLinkBoxProps) {
  const [copying, setCopying] = useState(false);

  const shareLink = `${window.location.origin}/orders/${orderId}`;

  const handleCopy = async () => {
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

  return (
    <div className="order-link-box">
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        <div>
          <LinkOutlined style={{ marginRight: 8, color: '#389e0d' }} />
          <strong style={{ color: '#389e0d' }}>拼单分享链接（发送给同事加入）</strong>
        </div>
        <Space.Compact style={{ width: '100%' }}>
          <Input value={shareLink} readOnly />
          <Button
            type="primary"
            icon={<CopyOutlined />}
            onClick={handleCopy}
            loading={copying}
          >
            复制
          </Button>
        </Space.Compact>
      </Space>
    </div>
  );
}
