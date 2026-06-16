import React from 'react';
import { Row, Col, Card } from 'antd';
import { formatMoney } from '../utils/format';

interface StatsCardsProps {
  myAmount: number;
  totalAmount: number;
  participantCount: number;
  aaAmount: number;
}

export default function StatsCards({
  myAmount,
  totalAmount,
  participantCount,
  aaAmount,
}: StatsCardsProps) {
  const stats = [
    {
      label: '我已点金额',
      value: formatMoney(myAmount),
      color: '#52c41a',
    },
    {
      label: '拼单总金额',
      value: formatMoney(totalAmount),
      color: '#1677ff',
    },
    {
      label: '参与人数',
      value: `${participantCount}人`,
      color: '#722ed1',
    },
    {
      label: '每人应付AA',
      value: formatMoney(aaAmount),
      color: '#eb2f96',
    },
  ];

  return (
    <Row gutter={[16, 16]}>
      {stats.map((stat) => (
        <Col xs={12} sm={12} md={6} key={stat.label}>
          <Card className="stat-card">
            <div className="stat-value" style={{ color: stat.color }}>
              {stat.value}
            </div>
            <div className="stat-label">{stat.label}</div>
          </Card>
        </Col>
      ))}
    </Row>
  );
}
