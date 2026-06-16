export const config = {
  port: process.env.PORT ? parseInt(process.env.PORT) : 3001,
  jwtSecret: process.env.JWT_SECRET || 'lunch-group-order-secret-key-2024',
  jwtExpiresIn: '7d',
  dbPath: process.env.DB_PATH || './lunch_order.db',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
};

export const PRESET_MERCHANTS = [
  '肯德基',
  '麦当劳',
  '星巴克',
  '真功夫',
  '美团外卖',
];
