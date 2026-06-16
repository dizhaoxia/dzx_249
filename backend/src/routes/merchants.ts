import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import { getDb } from '../db';
import { authMiddleware } from '../middleware/auth';
import {
  Merchant,
  Dish,
  CreateMerchantRequest,
  UpdateMerchantRequest,
  CreateDishRequest,
  UpdateDishRequest,
} from '../types';

const router = Router();

router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: '未登录' });
    }

    const db = await getDb();
    const merchants = await db.all(`
      SELECT m.*, 
        (SELECT COUNT(*) FROM dishes d WHERE d.merchant_id = m.id) as dish_count
      FROM merchants m
      WHERE m.owner_id = ? OR m.is_shared = 1
      ORDER BY m.created_at DESC
    `, [req.user.userId]);

    res.json({ merchants });
  } catch (error) {
    console.error('Get merchants error:', error);
    res.status(500).json({ error: '获取商家列表失败' });
  }
});

router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: '未登录' });
    }

    const db = await getDb();
    const merchant = await db.get<Merchant>(`
      SELECT * FROM merchants 
      WHERE id = ? AND (owner_id = ? OR is_shared = 1)
    `, [req.params.id, req.user.userId]);

    if (!merchant) {
      return res.status(404).json({ error: '商家不存在或无权限访问' });
    }

    const dishes = await db.all<Dish>(`
      SELECT * FROM dishes 
      WHERE merchant_id = ?
      ORDER BY category, created_at
    `, [req.params.id]);

    res.json({ merchant, dishes });
  } catch (error) {
    console.error('Get merchant detail error:', error);
    res.status(500).json({ error: '获取商家详情失败' });
  }
});

router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: '未登录' });
    }

    const { name, cover_image, description, is_shared } = req.body as CreateMerchantRequest;

    if (!name) {
      return res.status(400).json({ error: '商家名称为必填项' });
    }

    if (name.length > 50) {
      return res.status(400).json({ error: '商家名称不能超过50个字符' });
    }

    const db = await getDb();
    const merchantId = uuidv4();
    const now = dayjs().toISOString();

    await db.run(
      `INSERT INTO merchants (id, name, cover_image, description, owner_id, is_shared, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        merchantId,
        name,
        cover_image || null,
        description || null,
        req.user.userId,
        is_shared ? 1 : 0,
        now,
        now,
      ]
    );

    const merchant = await db.get<Merchant>('SELECT * FROM merchants WHERE id = ?', [merchantId]);
    res.json({ merchant });
  } catch (error) {
    console.error('Create merchant error:', error);
    res.status(500).json({ error: '创建商家失败' });
  }
});

router.put('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: '未登录' });
    }

    const db = await getDb();
    const merchant = await db.get<Merchant>('SELECT * FROM merchants WHERE id = ?', [req.params.id]);

    if (!merchant) {
      return res.status(404).json({ error: '商家不存在' });
    }

    if (merchant.owner_id !== req.user.userId) {
      return res.status(403).json({ error: '只有商家创建者可以编辑' });
    }

    const { name, cover_image, description, is_shared } = req.body as UpdateMerchantRequest;

    if (name !== undefined) {
      if (name.length > 50) {
        return res.status(400).json({ error: '商家名称不能超过50个字符' });
      }
    }

    const newName = name ?? merchant.name;
    const newCoverImage = cover_image !== undefined ? cover_image : merchant.cover_image;
    const newDescription = description !== undefined ? description : merchant.description;
    const newIsShared = is_shared !== undefined ? (is_shared ? 1 : 0) : merchant.is_shared;

    await db.run(
      'UPDATE merchants SET name = ?, cover_image = ?, description = ?, is_shared = ?, updated_at = ? WHERE id = ?',
      [newName, newCoverImage, newDescription, newIsShared, dayjs().toISOString(), req.params.id]
    );

    const updatedMerchant = await db.get<Merchant>('SELECT * FROM merchants WHERE id = ?', [req.params.id]);
    res.json({ merchant: updatedMerchant });
  } catch (error) {
    console.error('Update merchant error:', error);
    res.status(500).json({ error: '更新商家失败' });
  }
});

router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: '未登录' });
    }

    const db = await getDb();
    const merchant = await db.get<Merchant>('SELECT * FROM merchants WHERE id = ?', [req.params.id]);

    if (!merchant) {
      return res.status(404).json({ error: '商家不存在' });
    }

    if (merchant.owner_id !== req.user.userId) {
      return res.status(403).json({ error: '只有商家创建者可以删除' });
    }

    await db.run('DELETE FROM dishes WHERE merchant_id = ?', [req.params.id]);
    await db.run('DELETE FROM merchants WHERE id = ?', [req.params.id]);

    res.json({ success: true });
  } catch (error) {
    console.error('Delete merchant error:', error);
    res.status(500).json({ error: '删除商家失败' });
  }
});

router.get('/:id/dishes', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: '未登录' });
    }

    const db = await getDb();
    const merchant = await db.get<Merchant>(`
      SELECT * FROM merchants 
      WHERE id = ? AND (owner_id = ? OR is_shared = 1)
    `, [req.params.id, req.user.userId]);

    if (!merchant) {
      return res.status(404).json({ error: '商家不存在或无权限访问' });
    }

    const dishes = await db.all<Dish>(`
      SELECT * FROM dishes 
      WHERE merchant_id = ?
      ORDER BY category, created_at
    `, [req.params.id]);

    res.json({ dishes });
  } catch (error) {
    console.error('Get dishes error:', error);
    res.status(500).json({ error: '获取菜品列表失败' });
  }
});

router.post('/:id/dishes', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: '未登录' });
    }

    const db = await getDb();
    const merchant = await db.get<Merchant>('SELECT * FROM merchants WHERE id = ?', [req.params.id]);

    if (!merchant) {
      return res.status(404).json({ error: '商家不存在' });
    }

    if (merchant.owner_id !== req.user.userId) {
      return res.status(403).json({ error: '只有商家创建者可以添加菜品' });
    }

    const { name, price, image, category } = req.body as CreateDishRequest;

    if (!name) {
      return res.status(400).json({ error: '菜品名称为必填项' });
    }

    if (name.length > 100) {
      return res.status(400).json({ error: '菜品名称不能超过100个字符' });
    }

    if (price === undefined || price < 0 || price > 10000) {
      return res.status(400).json({ error: '单价范围为0-10000' });
    }

    const dishId = uuidv4();
    const now = dayjs().toISOString();

    await db.run(
      `INSERT INTO dishes (id, merchant_id, name, price, image, category, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        dishId,
        req.params.id,
        name,
        price,
        image || null,
        category || null,
        now,
        now,
      ]
    );

    const dish = await db.get<Dish>('SELECT * FROM dishes WHERE id = ?', [dishId]);
    res.json({ dish });
  } catch (error) {
    console.error('Create dish error:', error);
    res.status(500).json({ error: '添加菜品失败' });
  }
});

router.put('/:id/dishes/:dishId', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: '未登录' });
    }

    const db = await getDb();
    const merchant = await db.get<Merchant>('SELECT * FROM merchants WHERE id = ?', [req.params.id]);

    if (!merchant) {
      return res.status(404).json({ error: '商家不存在' });
    }

    if (merchant.owner_id !== req.user.userId) {
      return res.status(403).json({ error: '只有商家创建者可以编辑菜品' });
    }

    const dish = await db.get<Dish>('SELECT * FROM dishes WHERE id = ? AND merchant_id = ?', [req.params.dishId, req.params.id]);

    if (!dish) {
      return res.status(404).json({ error: '菜品不存在' });
    }

    const { name, price, image, category } = req.body as UpdateDishRequest;

    if (name !== undefined && name.length > 100) {
      return res.status(400).json({ error: '菜品名称不能超过100个字符' });
    }

    if (price !== undefined && (price < 0 || price > 10000)) {
      return res.status(400).json({ error: '单价范围为0-10000' });
    }

    const newName = name ?? dish.name;
    const newPrice = price ?? dish.price;
    const newImage = image !== undefined ? image : dish.image;
    const newCategory = category !== undefined ? category : dish.category;

    await db.run(
      'UPDATE dishes SET name = ?, price = ?, image = ?, category = ?, updated_at = ? WHERE id = ?',
      [newName, newPrice, newImage, newCategory, dayjs().toISOString(), req.params.dishId]
    );

    const updatedDish = await db.get<Dish>('SELECT * FROM dishes WHERE id = ?', [req.params.dishId]);
    res.json({ dish: updatedDish });
  } catch (error) {
    console.error('Update dish error:', error);
    res.status(500).json({ error: '更新菜品失败' });
  }
});

router.delete('/:id/dishes/:dishId', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: '未登录' });
    }

    const db = await getDb();
    const merchant = await db.get<Merchant>('SELECT * FROM merchants WHERE id = ?', [req.params.id]);

    if (!merchant) {
      return res.status(404).json({ error: '商家不存在' });
    }

    if (merchant.owner_id !== req.user.userId) {
      return res.status(403).json({ error: '只有商家创建者可以删除菜品' });
    }

    const dish = await db.get<Dish>('SELECT * FROM dishes WHERE id = ? AND merchant_id = ?', [req.params.dishId, req.params.id]);

    if (!dish) {
      return res.status(404).json({ error: '菜品不存在' });
    }

    await db.run('DELETE FROM dishes WHERE id = ?', [req.params.dishId]);

    res.json({ success: true });
  } catch (error) {
    console.error('Delete dish error:', error);
    res.status(500).json({ error: '删除菜品失败' });
  }
});

export default router;
