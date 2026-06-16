import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import { getDb } from '../db';
import { authMiddleware } from '../middleware/auth';
import { PRESET_MERCHANTS } from '../config';
import {
  GroupOrder,
  OrderItem,
  Participant,
  User,
  CreateOrderRequest,
  AddOrderItemRequest,
  UpdateOrderItemRequest,
} from '../types';

const router = Router();

router.get('/merchants', authMiddleware, (_req: Request, res: Response) => {
  res.json({ merchants: PRESET_MERCHANTS });
});

router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: '未登录' });
    }

    const { name, merchant, deadline } = req.body as CreateOrderRequest;

    if (!name || !merchant) {
      return res.status(400).json({ error: '拼单名称和商家为必填项' });
    }

    if (name.length > 50) {
      return res.status(400).json({ error: '拼单名称不能超过50个字符' });
    }

    if (merchant.length > 50) {
      return res.status(400).json({ error: '商家名称不能超过50个字符' });
    }

    const db = await getDb();
    const orderId = uuidv4();
    const createdAt = dayjs().toISOString();

    await db.run(
      'INSERT INTO group_orders (id, name, merchant, deadline, owner_id, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [orderId, name, merchant, deadline || null, req.user.userId, 'active', createdAt]
    );

    await db.run(
      'INSERT INTO participants (order_id, user_id, joined_at) VALUES (?, ?, ?)',
      [orderId, req.user.userId, createdAt]
    );

    res.json({ orderId });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: '创建拼单失败' });
  }
});

router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: '未登录' });
    }

    const { status = 'all' } = req.query;

    const db = await getDb();

    let sql = `
      SELECT DISTINCT go.*, 
        (SELECT COUNT(*) FROM participants p WHERE p.order_id = go.id) as participant_count,
        (SELECT COALESCE(SUM(oi.price * oi.quantity), 0) FROM order_items oi WHERE oi.order_id = go.id) as total_amount
      FROM group_orders go
      INNER JOIN participants p ON p.order_id = go.id
      WHERE p.user_id = ?
    `;
    const params: any[] = [req.user.userId];

    if (status === 'active') {
      sql += " AND go.status = 'active'";
    } else if (status === 'finished') {
      sql += " AND go.status = 'finished'";
    }

    sql += ' ORDER BY go.created_at DESC';

    const orders = await db.all(sql, params);
    res.json({ orders });
  } catch (error) {
    console.error('List orders error:', error);
    res.status(500).json({ error: '获取拼单列表失败' });
  }
});

async function getOrderDetail(db: any, orderId: string, currentUserId: string) {
  const order = (await db.get(
    'SELECT * FROM group_orders WHERE id = ?',
    [orderId]
  )) as GroupOrder | undefined;

  if (!order) {
    return null;
  }

  const participants = (await db.all(`
    SELECT p.*, u.nickname
    FROM participants p
    INNER JOIN users u ON u.id = p.user_id
    WHERE p.order_id = ?
    ORDER BY p.joined_at ASC
  `, [orderId])) as (Participant & { nickname: string })[];

  const orderItems = (await db.all(`
    SELECT oi.*, u.nickname
    FROM order_items oi
    INNER JOIN users u ON u.id = oi.user_id
    WHERE oi.order_id = ?
    ORDER BY oi.created_at ASC
  `, [orderId])) as (OrderItem & { nickname: string })[];

  const userItems = orderItems.filter((item: OrderItem & { nickname: string }) => item.user_id === currentUserId);
  const myAmount = userItems.reduce((sum: number, item: OrderItem & { nickname: string }) => sum + item.price * item.quantity, 0);
  const totalAmount = orderItems.reduce((sum: number, item: OrderItem & { nickname: string }) => sum + item.price * item.quantity, 0);
  const participantCount = participants.length;
  const aaAmount = participantCount > 0 ? totalAmount / participantCount : 0;

  const isOwner = order.owner_id === currentUserId;
  const isParticipant = participants.some((p: Participant & { nickname: string }) => p.user_id === currentUserId);

  return {
    order,
    participants,
    orderItems,
    myAmount,
    totalAmount,
    participantCount,
    aaAmount,
    isOwner,
    isParticipant,
  };
}

router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: '未登录' });
    }

    const db = await getDb();
    const detail = await getOrderDetail(db, req.params.id, req.user.userId);

    if (!detail) {
      return res.status(404).json({ error: '拼单不存在' });
    }

    res.json(detail);
  } catch (error) {
    console.error('Get order detail error:', error);
    res.status(500).json({ error: '获取拼单详情失败' });
  }
});

router.post('/:id/join', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: '未登录' });
    }

    const db = await getDb();
    const order = await db.get<GroupOrder>('SELECT * FROM group_orders WHERE id = ?', [req.params.id]);

    if (!order) {
      return res.status(404).json({ error: '拼单不存在' });
    }

    if (order.status === 'finished') {
      return res.status(400).json({ error: '拼单已结束，无法加入' });
    }

    const existing = await db.get(
      'SELECT * FROM participants WHERE order_id = ? AND user_id = ?',
      [req.params.id, req.user.userId]
    );

    if (!existing) {
      await db.run(
        'INSERT INTO participants (order_id, user_id, joined_at) VALUES (?, ?, ?)',
        [req.params.id, req.user.userId, dayjs().toISOString()]
      );
    }

    const detail = await getOrderDetail(db, req.params.id, req.user.userId);
    res.json(detail);
  } catch (error) {
    console.error('Join order error:', error);
    res.status(500).json({ error: '加入拼单失败' });
  }
});

router.post('/:id/leave', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: '未登录' });
    }

    const db = await getDb();
    const order = await db.get<GroupOrder>('SELECT * FROM group_orders WHERE id = ?', [req.params.id]);

    if (!order) {
      return res.status(404).json({ error: '拼单不存在' });
    }

    if (order.status === 'finished') {
      return res.status(400).json({ error: '拼单已结束，无法退出' });
    }

    if (order.owner_id === req.user.userId) {
      return res.status(400).json({ error: '发起人不能退出拼单，如需结束请使用结束拼单功能' });
    }

    await db.run('DELETE FROM order_items WHERE order_id = ? AND user_id = ?', [req.params.id, req.user.userId]);
    await db.run('DELETE FROM participants WHERE order_id = ? AND user_id = ?', [req.params.id, req.user.userId]);

    const detail = await getOrderDetail(db, req.params.id, req.user.userId);
    res.json(detail);
  } catch (error) {
    console.error('Leave order error:', error);
    res.status(500).json({ error: '退出拼单失败' });
  }
});

router.post('/:id/finish', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: '未登录' });
    }

    const db = await getDb();
    const order = await db.get<GroupOrder>('SELECT * FROM group_orders WHERE id = ?', [req.params.id]);

    if (!order) {
      return res.status(404).json({ error: '拼单不存在' });
    }

    if (order.owner_id !== req.user.userId) {
      return res.status(403).json({ error: '只有发起人可以结束拼单' });
    }

    if (order.status === 'finished') {
      return res.status(400).json({ error: '拼单已经结束' });
    }

    await db.run(
      "UPDATE group_orders SET status = 'finished', finished_at = ? WHERE id = ?",
      [dayjs().toISOString(), req.params.id]
    );

    const detail = await getOrderDetail(db, req.params.id, req.user.userId);
    res.json(detail);
  } catch (error) {
    console.error('Finish order error:', error);
    res.status(500).json({ error: '结束拼单失败' });
  }
});

router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: '未登录' });
    }

    const db = await getDb();
    const order = await db.get<GroupOrder>('SELECT * FROM group_orders WHERE id = ?', [req.params.id]);

    if (!order) {
      return res.status(404).json({ error: '拼单不存在' });
    }

    if (order.owner_id !== req.user.userId) {
      return res.status(403).json({ error: '只有发起人可以删除拼单' });
    }

    if (order.status === 'finished') {
      return res.status(400).json({ error: '已结束的拼单无法删除' });
    }

    await db.run('DELETE FROM order_items WHERE order_id = ?', [req.params.id]);
    await db.run('DELETE FROM participants WHERE order_id = ?', [req.params.id]);
    await db.run('DELETE FROM group_orders WHERE id = ?', [req.params.id]);

    res.json({ success: true });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({ error: '删除拼单失败' });
  }
});

router.post('/:id/remove-participant', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: '未登录' });
    }

    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: '用户ID为必填项' });
    }

    const db = await getDb();
    const order = await db.get<GroupOrder>('SELECT * FROM group_orders WHERE id = ?', [req.params.id]);

    if (!order) {
      return res.status(404).json({ error: '拼单不存在' });
    }

    if (order.owner_id !== req.user.userId) {
      return res.status(403).json({ error: '只有发起人可以移除参与者' });
    }

    if (order.status === 'finished') {
      return res.status(400).json({ error: '拼单已结束' });
    }

    if (order.owner_id === userId) {
      return res.status(400).json({ error: '不能移除发起人' });
    }

    await db.run('DELETE FROM order_items WHERE order_id = ? AND user_id = ?', [req.params.id, userId]);
    await db.run('DELETE FROM participants WHERE order_id = ? AND user_id = ?', [req.params.id, userId]);

    const detail = await getOrderDetail(db, req.params.id, req.user.userId);
    res.json(detail);
  } catch (error) {
    console.error('Remove participant error:', error);
    res.status(500).json({ error: '移除参与者失败' });
  }
});

router.post('/:id/items', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: '未登录' });
    }

    const { dish_name, price, quantity } = req.body as AddOrderItemRequest;

    if (!dish_name || price === undefined || quantity === undefined) {
      return res.status(400).json({ error: '菜品名、单价和数量为必填项' });
    }

    if (dish_name.length > 100) {
      return res.status(400).json({ error: '菜品名称不能超过100个字符' });
    }

    if (price < 0 || price > 10000) {
      return res.status(400).json({ error: '单价范围为0-10000' });
    }

    if (quantity < 1 || quantity > 999) {
      return res.status(400).json({ error: '数量范围为1-999' });
    }

    const db = await getDb();
    const order = await db.get<GroupOrder>('SELECT * FROM group_orders WHERE id = ?', [req.params.id]);

    if (!order) {
      return res.status(404).json({ error: '拼单不存在' });
    }

    if (order.status === 'finished') {
      return res.status(400).json({ error: '拼单已结束，无法添加菜品' });
    }

    const participant = await db.get(
      'SELECT * FROM participants WHERE order_id = ? AND user_id = ?',
      [req.params.id, req.user.userId]
    );

    if (!participant) {
      return res.status(400).json({ error: '请先加入拼单' });
    }

    const itemId = uuidv4();
    const now = dayjs().toISOString();

    await db.run(
      'INSERT INTO order_items (id, order_id, user_id, dish_name, price, quantity, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [itemId, req.params.id, req.user.userId, dish_name, price, quantity, now, now]
    );

    const detail = await getOrderDetail(db, req.params.id, req.user.userId);
    res.json(detail);
  } catch (error) {
    console.error('Add order item error:', error);
    res.status(500).json({ error: '添加菜品失败' });
  }
});

router.put('/:id/items/:itemId', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: '未登录' });
    }

    const { dish_name, price, quantity } = req.body as UpdateOrderItemRequest;

    const db = await getDb();
    const order = await db.get<GroupOrder>('SELECT * FROM group_orders WHERE id = ?', [req.params.id]);

    if (!order) {
      return res.status(404).json({ error: '拼单不存在' });
    }

    if (order.status === 'finished') {
      return res.status(400).json({ error: '拼单已结束，无法修改菜品' });
    }

    const item = await db.get<OrderItem>('SELECT * FROM order_items WHERE id = ? AND order_id = ?', [req.params.itemId, req.params.id]);

    if (!item) {
      return res.status(404).json({ error: '菜品不存在' });
    }

    if (item.user_id !== req.user.userId) {
      return res.status(403).json({ error: '只能修改自己添加的菜品' });
    }

    if (dish_name !== undefined) {
      if (dish_name.length > 100) {
        return res.status(400).json({ error: '菜品名称不能超过100个字符' });
      }
    }

    if (price !== undefined) {
      if (price < 0 || price > 10000) {
        return res.status(400).json({ error: '单价范围为0-10000' });
      }
    }

    if (quantity !== undefined) {
      if (quantity < 1 || quantity > 999) {
        return res.status(400).json({ error: '数量范围为1-999' });
      }
    }

    const newDishName = dish_name ?? item.dish_name;
    const newPrice = price ?? item.price;
    const newQuantity = quantity ?? item.quantity;

    await db.run(
      'UPDATE order_items SET dish_name = ?, price = ?, quantity = ?, updated_at = ? WHERE id = ?',
      [newDishName, newPrice, newQuantity, dayjs().toISOString(), req.params.itemId]
    );

    const detail = await getOrderDetail(db, req.params.id, req.user.userId);
    res.json(detail);
  } catch (error) {
    console.error('Update order item error:', error);
    res.status(500).json({ error: '修改菜品失败' });
  }
});

router.delete('/:id/items/:itemId', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: '未登录' });
    }

    const db = await getDb();
    const order = await db.get<GroupOrder>('SELECT * FROM group_orders WHERE id = ?', [req.params.id]);

    if (!order) {
      return res.status(404).json({ error: '拼单不存在' });
    }

    if (order.status === 'finished') {
      return res.status(400).json({ error: '拼单已结束，无法删除菜品' });
    }

    const item = await db.get<OrderItem>('SELECT * FROM order_items WHERE id = ? AND order_id = ?', [req.params.itemId, req.params.id]);

    if (!item) {
      return res.status(404).json({ error: '菜品不存在' });
    }

    if (item.user_id !== req.user.userId) {
      return res.status(403).json({ error: '只能删除自己添加的菜品' });
    }

    await db.run('DELETE FROM order_items WHERE id = ?', [req.params.itemId]);

    const detail = await getOrderDetail(db, req.params.id, req.user.userId);
    res.json(detail);
  } catch (error) {
    console.error('Delete order item error:', error);
    res.status(500).json({ error: '删除菜品失败' });
  }
});

export default router;
